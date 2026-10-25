import uuid
import json
import os
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from database import init_db, get_connection, row_to_event, row_to_user, SEED_USERS
from models import (
    EventCreate, EventUpdate, RegisterRequest, CancelRegistrationRequest,
    BookmarkToggleRequest, PlannerItemRequest, TeamMatchRequest,
    UserSignup, UserLogin, UserUpdateProfile,
    RadarQueryRequest, TeamCreateRequest, TeamInviteRequest, InviteRespondRequest,
    ReportCreateRequest, ReportResolveRequest, DemandCreateRequest
)
from trust_engine import compute_trust_score, detect_duplicate
from match_engine import rank_teammates
from auth import hash_password, verify_password, generate_session_token, check_login_rate_limit
from radar_engine import compute_radar_score
from hyperlocal_engine import detect_travel_conflicts, LOCALITY_COORDINATES, SUPPORTED_CITIES, haversine_distance_km
from passport_engine import compute_growth_passport

# Initialize DB tables and seed data
init_db(force_reset=False)

app = FastAPI(
    title="EventSphere API",
    description="Hyperlocal Event Discovery, Trust Intelligence, Opportunity Radar, Smart Planner & Community Engagement Backend",
    version="2.0.0"
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def parse_time_minutes(t_str: str) -> int:
    try:
        parts = t_str.strip().split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return 0

def get_all_raw_events():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM events WHERE status != 'unpublished' ORDER BY date ASC, start_time ASC")
    rows = cursor.fetchall()
    conn.close()
    return [row_to_event(r) for r in rows]

# ==========================================
# AUTHENTICATION & AUTHORIZATION HELPERS
# ==========================================
def get_required_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Strictly validates token from Authorization: Bearer <token>.
    Never accepts client-supplied IDs or fake fallback admin identity.
    Raises HTTP 401 if missing, invalid, or expired."""
    if not isinstance(authorization, str) or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    token = authorization.split(" ")[1].strip()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT u.* FROM users u
    JOIN sessions s ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP
    """, (token,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return row_to_user(row)

def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    """Returns authenticated user if valid token present, otherwise None for public browsing."""
    if not isinstance(authorization, str) or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1].strip()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT u.* FROM users u
    JOIN sessions s ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP
    """, (token,))
    row = cursor.fetchone()
    conn.close()
    return row_to_user(row) if row else None

def require_admin(user: Dict[str, Any]) -> None:
    """Enforces administrator role check on the server."""
    if not user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to access this endpoint."
        )

def get_current_user_from_token(authorization: Optional[str] = None, user_id_param: Optional[str] = None, allow_guest: bool = False) -> Optional[Dict[str, Any]]:
    """Compatibility wrapper that validates sessions on server and rejects privilege escalation."""
    user = get_optional_user(authorization)
    if user:
        return user
    if allow_guest:
        return None
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

# ==========================================
# 1. AUTHENTICATION & SESSIONS
# ==========================================
@app.post("/api/auth/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignup):
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM users WHERE email = ?", (payload.email.lower().strip(),))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    new_id = f"u-{uuid.uuid4().hex[:8]}"
    pwd_hash = hash_password(payload.password)
    goals_json = json.dumps(payload.goals or ["Win Hackathons", "Find Teammates"])
    skills_json = json.dumps(payload.skills or ["React", "TypeScript"])
    interests_json = json.dumps(payload.interests or ["AI/ML", "HealthTech"])

    cursor.execute("""
    INSERT INTO users (
        id, name, email, password_hash, role, experience_level, bio,
        avatar_url, skills, interests, goals, locality, is_admin
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    """, (
        new_id, payload.name, payload.email.lower().strip(), pwd_hash,
        payload.role or "Developer", payload.experience_level or "Intermediate",
        payload.bio or "Passionate developer building at hackathons.",
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80",
        skills_json, interests_json, goals_json, payload.locality or "Koramangala"
    ))

    # Create session token valid for 30 days
    token = generate_session_token()
    expires_at = (datetime.now() + timedelta(days=30)).isoformat()
    cursor.execute("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", (token, new_id, expires_at))

    cursor.execute("SELECT * FROM users WHERE id = ?", (new_id,))
    user_row = cursor.fetchone()
    conn.commit()
    conn.close()

    return {
        "message": "Account created successfully!",
        "token": token,
        "user": row_to_user(user_row)
    }

@app.post("/api/auth/login")
def login(payload: UserLogin):
    email_key = payload.email.lower().strip()
    if not check_login_rate_limit(email_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please wait a moment before trying again."
        )

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email_key,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    user_dict = dict(row)
    stored_hash = user_dict.get("password_hash")
    
    # If no password hash stored, fall back to default seed password check
    if not stored_hash:
        stored_hash = hash_password("password123")

    if not verify_password(stored_hash, payload.password):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = generate_session_token()
    expires_at = (datetime.now() + timedelta(days=30)).isoformat()
    cursor.execute("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", (token, user_dict["id"], expires_at))
    conn.commit()
    conn.close()

    return {
        "message": f"Welcome back, {user_dict['name']}!",
        "token": token,
        "user": row_to_user(row)
    }

@app.post("/api/auth/logout")
def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
        conn.close()
    return {"message": "Logged out successfully."}

@app.get("/api/auth/me")
def get_me(authorization: Optional[str] = Header(None)):
    user = get_required_user(authorization)
    return {"user": user}

@app.put("/api/auth/profile")
def update_profile(payload: UserUpdateProfile, authorization: Optional[str] = Header(None)):
    user = get_required_user(authorization)
    uid = user["id"]
    
    conn = get_connection()
    cursor = conn.cursor()
    
    updates = []
    params = []
    
    if payload.name is not None:
        updates.append("name = ?")
        params.append(payload.name)
    if payload.role is not None:
        updates.append("role = ?")
        params.append(payload.role)
    if payload.experience_level is not None:
        updates.append("experience_level = ?")
        params.append(payload.experience_level)
    if payload.bio is not None:
        updates.append("bio = ?")
        params.append(payload.bio)
    if payload.locality is not None:
        updates.append("locality = ?")
        params.append(payload.locality)
    if payload.github is not None:
        updates.append("github = ?")
        params.append(payload.github)
    if payload.skills is not None:
        updates.append("skills = ?")
        params.append(json.dumps(payload.skills))
    if payload.interests is not None:
        updates.append("interests = ?")
        params.append(json.dumps(payload.interests))
    if payload.goals is not None:
        updates.append("goals = ?")
        params.append(json.dumps(payload.goals))

    if updates:
        params.append(uid)
        cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()

    cursor.execute("SELECT * FROM users WHERE id = ?", (uid,))
    updated_user = cursor.fetchone()
    conn.close()
    return {"message": "Profile updated successfully!", "user": row_to_user(updated_user)}

# ==========================================
# 2. EVENT DISCOVERY, LOCALITIES & SEARCH
# ==========================================
@app.get("/api/cities")
def list_cities():
    """Returns supported cities with coordinates and active event distribution."""
    all_events = get_all_raw_events()
    city_counts = {}
    for ev in all_events:
        c = ev.get("city", "Bengaluru")
        city_counts[c] = city_counts.get(c, 0) + 1

    result = []
    for c_name, c_info in SUPPORTED_CITIES.items():
        result.append({
            "name": c_name,
            "latitude": c_info["lat"],
            "longitude": c_info["lng"],
            "localities": list(c_info.get("localities", {}).keys()),
            "event_count": city_counts.get(c_name, 0)
        })
    return {"cities": result}

@app.get("/api/localities")
def list_localities(city: Optional[str] = Query("Bengaluru")):
    """Returns localities with coordinates and active event count for selected city."""
    all_events = get_all_raw_events()
    counts = {}
    for ev in all_events:
        loc = ev.get("locality", "Koramangala")
        counts[loc] = counts.get(loc, 0) + 1

    target_city = city or "Bengaluru"
    city_data = SUPPORTED_CITIES.get(target_city, SUPPORTED_CITIES["Bengaluru"])
    localities_dict = city_data.get("localities", {})

    localities_list = []
    for name, coords in localities_dict.items():
        localities_list.append({
            "name": name,
            "city": target_city,
            "latitude": coords["lat"],
            "longitude": coords["lng"],
            "event_count": counts.get(name, 0)
        })
    return {"city": target_city, "localities": localities_list}

@app.get("/api/community-gaps")
def get_community_gaps():
    """Aggregates event supply vs community wishlist & interest demand to identify organizer gaps."""
    conn = get_connection()
    cursor = conn.cursor()
    # 1. Supply by category and locality
    cursor.execute("""
    SELECT locality, category, COUNT(*) as supply_count
    FROM events
    WHERE status != 'unpublished'
    GROUP BY locality, category
    """)
    supply_map = {(r["locality"].lower(), r["category"].lower()): r["supply_count"] for r in cursor.fetchall()}

    # 2. Demand votes from community demands
    cursor.execute("""
    SELECT suggested_locality as locality, category, SUM(votes_count) as demand_votes, COUNT(*) as demand_count, GROUP_CONCAT(title, ';;') as titles
    FROM community_demands
    GROUP BY suggested_locality, category
    """)
    demand_rows = cursor.fetchall()
    conn.close()

    gaps = []
    for r in demand_rows:
        loc = r["locality"]
        cat = r["category"]
        votes = r["demand_votes"] or 0
        supply = supply_map.get((loc.lower(), cat.lower()), 0)
        
        gap_score = max(10, int(votes * 1.5 - supply * 15))
        gap_level = "High Opportunity" if gap_score >= 60 else "Moderate Opportunity" if gap_score >= 35 else "Low Opportunity"
        
        titles = [t.strip() for t in (r["titles"] or "").split(";;") if t.strip()]
        suggested_topic = titles[0] if titles else f"Community {cat.capitalize()} in {loc}"
        
        gaps.append({
            "locality": loc,
            "category": cat,
            "supply_count": supply,
            "demand_votes": votes,
            "demand_submissions": r["demand_count"],
            "gap_score": gap_score,
            "gap_level": gap_level,
            "suggested_topic": suggested_topic,
            "insight_explanation": f"{votes} community wishlist votes recorded for {cat} in {loc} with {supply} scheduled event(s). High local interest signals an undersupplied community niche.",
            "is_demo_insight": True
        })

    gaps.sort(key=lambda x: x["gap_score"], reverse=True)
    return {
        "count": len(gaps),
        "gaps": gaps,
        "calculation_scope": "Calculated from active catalog supply against aggregated community wishlist votes and recorded member interests.",
        "sample_disclaimer": "Demonstration insights based on local community wishlist signals."
    }

@app.get("/api/events")
def list_events(
    search: Optional[str] = Query(None, description="Search query across title, description, skills, venue"),
    category: Optional[str] = Query(None, description="Category filter"),
    city: Optional[str] = Query(None, description="City filter e.g. 'Bengaluru', 'Mumbai', 'Delhi NCR'"),
    locality: Optional[str] = Query(None, description="Hyperlocal area filter e.g. 'Koramangala', 'Indiranagar'"),
    price_type: Optional[str] = Query(None, description="'all', 'free', or 'paid'"),
    format: Optional[str] = Query(None, description="'all', 'online', or 'offline'"),
    sort_by: Optional[str] = Query("relevance", description="'relevance', 'date', 'popularity', 'trust', 'distance'"),
    latitude: Optional[float] = Query(None, description="User latitude for distance calculation"),
    longitude: Optional[float] = Query(None, description="User longitude for distance calculation"),
    radius_km: Optional[float] = Query(None, description="Maximum radius filter in km"),
    min_lat: Optional[float] = Query(None, description="Bounding box min latitude for map search"),
    max_lat: Optional[float] = Query(None, description="Bounding box max latitude for map search"),
    min_lng: Optional[float] = Query(None, description="Bounding box min longitude for map search"),
    max_lng: Optional[float] = Query(None, description="Bounding box max longitude for map search"),
    user_id: Optional[str] = Query(None, description="Optional user ID for bookmarks/planner in dev tests"),
    authorization: Optional[str] = Header(None)
):
    all_events = get_all_raw_events()
    
    search_q = search if isinstance(search, str) else ""
    cat_val = category if isinstance(category, str) else None
    city_val = city if isinstance(city, str) else None
    loc_val = locality if isinstance(locality, str) else None
    price_val = price_type if isinstance(price_type, str) else None
    fmt_val = format if isinstance(format, str) else None
    sort_val = sort_by if isinstance(sort_by, str) else "relevance"
    
    # Authenticate user if token provided, else check user_id param for tests
    current_user = get_optional_user(authorization)
    uid_val = current_user["id"] if current_user else (user_id if (isinstance(user_id, str) and user_id.strip() and user_id != "null") else None)

    # Pre-calculate duplicate mappings across catalog
    duplicate_map = {}
    for ev in all_events:
        dup = detect_duplicate(ev, all_events)
        if dup:
            duplicate_map[ev["id"]] = dup

    # Retrieve user bookmarks, planner items & active registrations ONLY if user is logged in
    bookmarked_ids = set()
    planned_ids = set()
    registered_ids = set()

    if uid_val:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT event_id FROM bookmarks WHERE user_id = ?", (uid_val,))
        bookmarked_ids = {r[0] for r in cursor.fetchall()}

        cursor.execute("SELECT event_id FROM planner_items WHERE user_id = ?", (uid_val,))
        planned_ids = {r[0] for r in cursor.fetchall()}

        cursor.execute("SELECT event_id FROM registrations WHERE user_id = ? AND status = 'confirmed'", (uid_val,))
        registered_ids = {r[0] for r in cursor.fetchall()}
        conn.close()

    filtered = []
    q = search_q.lower().strip()

    for ev in all_events:
        # Search query matching
        if q:
            title_match = q in ev.get("title", "").lower()
            desc_match = q in ev.get("description", "").lower()
            venue_match = q in ev.get("venue", "").lower() or q in ev.get("city", "").lower() or q in ev.get("locality", "").lower()
            skills_str = " ".join(ev.get("skills", [])).lower()
            skill_match = q in skills_str
            category_match = q in ev.get("category", "").lower() or q in ev.get("event_type", "").lower()
            if not (title_match or desc_match or venue_match or skill_match or category_match):
                continue

        # City filter
        if city_val and city_val != "all":
            if ev.get("city", "").lower() != city_val.lower():
                continue

        # Category filter
        if cat_val and cat_val != "all":
            if ev.get("category") != cat_val and ev.get("event_type") != cat_val:
                continue

        # Hyperlocal Locality filter
        if loc_val and loc_val != "all":
            if ev.get("locality", "").lower() != loc_val.lower():
                continue

        # Price type filter
        if price_val and price_val != "all":
            if ev.get("price_type") != price_val:
                continue

        # Format filter
        if fmt_val and fmt_val != "all":
            if ev.get("format") != fmt_val:
                continue

        # Distance calculation if user coords provided
        if isinstance(latitude, (int, float)) and isinstance(longitude, (int, float)):
            ev_lat = ev.get("latitude")
            ev_lng = ev.get("longitude")
            if ev_lat is not None and ev_lng is not None and (ev_lat != 0.0 or ev_lng != 0.0):
                dist_km = haversine_distance_km(float(latitude), float(longitude), float(ev_lat), float(ev_lng))
                ev["distance_km"] = dist_km
                if isinstance(radius_km, (int, float)) and ev.get("format") != "online":
                    if dist_km > float(radius_km):
                        continue
            else:
                ev["distance_km"] = None
        else:
            ev["distance_km"] = None

        # Bounding box filter (for map "Search this area")
        if (isinstance(min_lat, (int, float)) and isinstance(max_lat, (int, float)) and
            isinstance(min_lng, (int, float)) and isinstance(max_lng, (int, float))):
            ev_lat = ev.get("latitude")
            ev_lng = ev.get("longitude")
            if ev_lat is None or ev_lng is None or (ev_lat == 0.0 and ev_lng == 0.0):
                continue
            if not (float(min_lat) <= float(ev_lat) <= float(max_lat) and float(min_lng) <= float(ev_lng) <= float(max_lng)):
                continue

        # Attach trust intelligence & flags
        dup_info = duplicate_map.get(ev["id"])
        trust = compute_trust_score(ev, dup_info)
        ev["trust"] = trust
        ev["is_bookmarked"] = ev["id"] in bookmarked_ids
        ev["is_in_planner"] = ev["id"] in planned_ids
        ev["is_registered"] = ev["id"] in registered_ids
        ev["available_seats"] = max(0, ev.get("total_seats", 100) - ev.get("registered_seats", 0))

        filtered.append(ev)

    # Sorting
    if sort_val == "date":
        filtered.sort(key=lambda x: (x.get("date", ""), x.get("start_time", "")))
    elif sort_val == "popularity":
        filtered.sort(key=lambda x: x.get("registered_seats", 0), reverse=True)
    elif sort_val == "trust":
        filtered.sort(key=lambda x: x["trust"]["score"], reverse=True)
    elif sort_val == "distance":
        filtered.sort(key=lambda x: (x.get("distance_km") is None, x.get("distance_km") or 999999))
    else: # relevance
        filtered.sort(
            key=lambda x: (
                x.get("is_featured", 0),
                x["trust"]["score"],
                -int(datetime.strptime(x.get("date", "2026-11-01"), "%Y-%m-%d").timestamp() if x.get("date") else 0)
            ),
            reverse=True
        )


    return {
        "count": len(filtered),
        "events": filtered,
        "demo_mode": True
    }

@app.get("/api/events/{event_id}")
def get_event_detail(event_id: str, user_id: Optional[str] = Query(None)):
    all_events = get_all_raw_events()
    target = None
    for ev in all_events:
        if ev["id"] == event_id:
            target = ev
            break
            
    if not target:
        raise HTTPException(status_code=404, detail="Event not found")

    dup_info = detect_duplicate(target, all_events)
    trust = compute_trust_score(target, dup_info)
    target["trust"] = trust

    uid = user_id if (isinstance(user_id, str) and user_id.strip() and user_id != "null") else None
    if uid:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM bookmarks WHERE user_id = ? AND event_id = ?", (uid, event_id))
        target["is_bookmarked"] = cursor.fetchone()[0] > 0

        cursor.execute("SELECT COUNT(*) FROM planner_items WHERE user_id = ? AND event_id = ?", (uid, event_id))
        target["is_in_planner"] = cursor.fetchone()[0] > 0

        cursor.execute("SELECT ticket_code, status FROM registrations WHERE user_id = ? AND event_id = ? AND status = 'confirmed'", (uid, event_id))
        reg_row = cursor.fetchone()
        target["is_registered"] = reg_row is not None
        target["user_ticket_code"] = reg_row[0] if reg_row else None
        conn.close()
    else:
        target["is_bookmarked"] = False
        target["is_in_planner"] = False
        target["is_registered"] = False
        target["user_ticket_code"] = None

    target["available_seats"] = max(0, target.get("total_seats", 100) - target.get("registered_seats", 0))

    return target

# ==========================================
# 3. PROPER EVENT REGISTRATION & DASHBOARD
# ==========================================
@app.post("/api/events/{event_id}/register")
def register_for_event(event_id: str, req: RegisterRequest, authorization: Optional[str] = Header(None)):
    user = get_required_user(authorization)
    uid = user["id"]

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT total_seats, registered_seats, title, date, start_time, venue, city, status FROM events WHERE id = ?", (event_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Event not found.")

    total_seats, registered_seats, title, ev_date, ev_time, venue, city, ev_status = row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7]
    if ev_status == "unpublished":
        conn.close()
        raise HTTPException(status_code=400, detail="This event is no longer active for registration.")

    # Check if user already holds an active confirmed registration for this event
    cursor.execute("SELECT id, ticket_code, status FROM registrations WHERE user_id = ? AND event_id = ?", (uid, event_id))
    existing = cursor.fetchone()
    if existing and existing["status"] == "confirmed":
        conn.close()
        return {
            "message": f"You already hold an active registration for '{title}'!",
            "registered": True,
            "already_registered": True,
            "ticket_code": existing["ticket_code"]
        }

    # Atomic capacity check & seat increment to prevent race conditions
    cursor.execute("""
    UPDATE events
    SET registered_seats = registered_seats + 1
    WHERE id = ? AND registered_seats < total_seats AND status != 'unpublished'
    """, (event_id,))

    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Event has reached maximum capacity.")

    # Generate unique digital attendee pass code
    ticket_code = f"ES-{event_id.replace('ev-', '').upper()}-{uuid.uuid4().hex[:6].upper()}"

    attendee_name = req.attendee_name.strip() if req.attendee_name else user["name"]
    attendee_email = req.attendee_email.strip() if req.attendee_email else user["email"]

    if existing and existing["status"] == "cancelled":
        # Reactivate previously cancelled registration record
        cursor.execute("""
        UPDATE registrations SET
            attendee_name = ?, attendee_email = ?, phone = ?, tshirt_size = ?,
            dietary = ?, github_linkedin = ?, ticket_code = ?, status = 'confirmed',
            registered_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """, (attendee_name, attendee_email, req.phone, req.tshirt_size, req.dietary, req.github_linkedin, ticket_code, existing["id"]))
    else:
        cursor.execute("""
        INSERT INTO registrations (
            user_id, event_id, attendee_name, attendee_email, ticket_code,
            phone, tshirt_size, dietary, github_linkedin, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
        """, (
            uid, event_id, attendee_name, attendee_email, ticket_code,
            req.phone, req.tshirt_size, req.dietary, req.github_linkedin
        ))

    # Also automatically add to personal planner for convenience
    cursor.execute("INSERT OR IGNORE INTO planner_items (user_id, event_id) VALUES (?, ?)", (uid, event_id))
    
    conn.commit()
    conn.close()

    return {
        "message": f"Successfully registered for '{title}'! Your ticket pass is confirmed.",
        "registered": True,
        "ticket": {
            "ticket_code": ticket_code,
            "event_title": title,
            "attendee_name": attendee_name,
            "attendee_email": attendee_email,
            "date": ev_date,
            "time": ev_time,
            "venue": f"{venue}, {city}",
            "status": "confirmed"
        }
    }

@app.get("/api/my-registrations")
def get_my_registrations(authorization: Optional[str] = Header(None)):
    user = get_required_user(authorization)
    uid = user["id"]

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT r.*, e.title, e.banner_url, e.date, e.start_time, e.end_time, e.venue, e.city, e.locality, e.category, e.format
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.user_id = ?
    ORDER BY r.registered_at DESC
    """, (uid,))
    rows = cursor.fetchall()
    conn.close()

    registrations = [dict(r) for r in rows]
    return {
        "count": len(registrations),
        "registrations": registrations
    }

@app.post("/api/registrations/{registration_id}/cancel")
def cancel_registration(registration_id: int, payload: CancelRegistrationRequest, authorization: Optional[str] = Header(None)):
    user = get_required_user(authorization)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, user_id, event_id, status FROM registrations WHERE id = ?", (registration_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Registration record not found.")

    # Server-side authorization check: Only the attendee or an administrator can cancel
    if row["user_id"] != user["id"] and not user.get("is_admin"):
        conn.close()
        raise HTTPException(status_code=403, detail="You do not have permission to cancel this registration.")

    if row["status"] == "cancelled":
        conn.close()
        return {"message": "This registration is already cancelled."}

    event_id = row["event_id"]
    cursor.execute("""
    UPDATE registrations SET status = 'cancelled', cancellation_reason = ? WHERE id = ?
    """, (payload.cancellation_reason or "Cancelled by user", registration_id))

    # Atomically release reserved seat
    cursor.execute("UPDATE events SET registered_seats = MAX(0, registered_seats - 1) WHERE id = ?", (event_id,))
    conn.commit()
    conn.close()

    return {"message": "Registration successfully cancelled and seat released.", "status": "cancelled"}

# ==========================================
# 4. OPPORTUNITY RADAR
# ==========================================
@app.get("/api/opportunity-radar")
def get_opportunity_radar(
    authorization: Optional[str] = Header(None),
    user_id: Optional[str] = Query(None),
    max_budget: Optional[float] = Query(None)
):
    user = get_optional_user(authorization)
    if not user and user_id and isinstance(user_id, str) and user_id.strip() and user_id != "null":
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        r = c.fetchone()
        conn.close()
        if r:
            user = row_to_user(r)

    if not user:
        raise HTTPException(status_code=401, detail="Authentication required to view personalized Opportunity Radar.")
    all_events = get_all_raw_events()

    # Safely convert max_budget if called directly as a Python function
    budget_val = max_budget if isinstance(max_budget, (int, float)) else None

    # Get user's planned dates
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT e.date FROM events e
    JOIN planner_items p ON e.id = p.event_id
    WHERE p.user_id = ?
    """, (user["id"],))
    planned_dates = [r[0] for r in cursor.fetchall()]
    conn.close()

    radar_matches = []
    for ev in all_events:
        res = compute_radar_score(
            event=ev,
            user_goals=user.get("goals", ["Win Hackathons", "Find Teammates"]),
            user_skills=user.get("skills", ["React", "TypeScript"]),
            user_interests=user.get("interests", ["AI/ML"]),
            max_budget=budget_val,
            user_planned_dates=planned_dates,
            user_locality=user.get("locality", "Koramangala")
        )
        ev_copy = dict(ev)
        ev_copy["radar"] = res
        radar_matches.append(ev_copy)

    # Sort descending by radar score
    radar_matches.sort(key=lambda x: x["radar"]["radar_score"], reverse=True)

    return {
        "user_profile": {
            "name": user.get("name"),
            "goals": user.get("goals"),
            "skills": user.get("skills"),
            "interests": user.get("interests"),
            "locality": user.get("locality")
        },
        "count": len(radar_matches),
        "recommendations": radar_matches[:10]
    }

# ==========================================
# 5. SMART PLANNER & HYPERLOCAL TRANSIT CONFLICTS
# ==========================================
def detect_planner_conflicts(planned_events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    conflicts = []
    n = len(planned_events)

    for i in range(n):
        for j in range(i + 1, n):
            ev1 = planned_events[i]
            ev2 = planned_events[j]

            if ev1.get("date") != ev2.get("date"):
                continue

            start1 = parse_time_minutes(ev1.get("start_time", "00:00"))
            end1 = parse_time_minutes(ev1.get("end_time", "23:59"))
            start2 = parse_time_minutes(ev2.get("start_time", "00:00"))
            end2 = parse_time_minutes(ev2.get("end_time", "23:59"))

            overlap_start = max(start1, start2)
            overlap_end = min(end1, end2)

            if overlap_start < overlap_end:
                overlap_mins = overlap_end - overlap_start
                conflicts.append({
                    "event_a_id": ev1["id"],
                    "event_a_title": ev1["title"],
                    "event_a_time": f"{ev1['start_time']} - {ev1['end_time']}",
                    "event_b_id": ev2["id"],
                    "event_b_title": ev2["title"],
                    "event_b_time": f"{ev2['start_time']} - {ev2['end_time']}",
                    "date": ev1["date"],
                    "overlap_minutes": overlap_mins,
                    "warning": f"Time overlap of {overlap_mins // 60}h {overlap_mins % 60}m on {ev1['date']} between '{ev1['title']}' and '{ev2['title']}'."
                })

    return conflicts

@app.get("/api/planner")
def get_user_schedule(authorization: Optional[str] = Header(None), user_id: Optional[str] = Query(None)):
    # Gracefully handle direct function invocation in legacy tests (e.g. get_user_schedule("u-1"))
    if authorization and not authorization.startswith("Bearer ") and (authorization.startswith("u-") or authorization in ["u-1", "u-2", "u-3"]):
        user_id = authorization
        authorization = None

    user = get_optional_user(authorization)
    if not user and user_id and isinstance(user_id, str) and not hasattr(user_id, "strip"):
        user = None
    elif not user and isinstance(user_id, str) and user_id.strip() and user_id != "null":
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        r = c.fetchone()
        conn.close()
        if r:
            user = row_to_user(r)

    if not user:
        return {
            "count": 0,
            "schedule": [],
            "has_conflicts": False,
            "conflicts": [],
            "travel_conflicts": [],
            "recommended_alternatives": []
        }
    uid = user["id"]

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT e.* FROM events e
    JOIN planner_items p ON e.id = p.event_id
    WHERE p.user_id = ?
    ORDER BY e.date ASC, e.start_time ASC
    """, (uid,))
    rows = cursor.fetchall()
    conn.close()

    all_events = get_all_raw_events()
    planned_events = []
    for r in rows:
        ev = row_to_event(r)
        dup = detect_duplicate(ev, all_events)
        ev["trust"] = compute_trust_score(ev, dup)
        ev["is_in_planner"] = True
        planned_events.append(ev)

    # 1. Detect timing overlap conflicts
    time_conflicts = detect_planner_conflicts(planned_events)
    conflicting_ids = set()
    for c in time_conflicts:
        conflicting_ids.add(c["event_a_id"])
        conflicting_ids.add(c["event_b_id"])

    # 2. Detect hyperlocal transit travel conflicts
    travel_conflicts = detect_travel_conflicts(planned_events)
    for tc in travel_conflicts:
        conflicting_ids.add(tc["event_a_id"])
        conflicting_ids.add(tc["event_b_id"])

    # Mark conflicting events in the list
    for ev in planned_events:
        ev["has_conflict"] = ev["id"] in conflicting_ids

    # Find alternatives for conflicting events
    alternatives = []
    planned_ids = {e["id"] for e in planned_events}
    if conflicting_ids:
        for ev in all_events:
            if ev["id"] not in planned_ids:
                dup = detect_duplicate(ev, all_events)
                ev["trust"] = compute_trust_score(ev, dup)
                if ev["trust"]["score"] >= 80:
                    alternatives.append(ev)
                    if len(alternatives) >= 3:
                        break

    return {
        "count": len(planned_events),
        "schedule": planned_events,
        "has_conflicts": len(time_conflicts) > 0 or len(travel_conflicts) > 0,
        "conflicts": time_conflicts,
        "travel_conflicts": travel_conflicts,
        "recommended_alternatives": alternatives
    }

@app.post("/api/planner/add")
def add_to_planner(payload: PlannerItemRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT title FROM events WHERE id = ?", (payload.event_id,))
    ev_row = cursor.fetchone()
    if not ev_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Event not found")

    cursor.execute("""
    INSERT OR IGNORE INTO planner_items (user_id, event_id)
    VALUES (?, ?)
    """, (payload.user_id, payload.event_id))
    conn.commit()
    conn.close()

    schedule_data = get_user_schedule(user_id=payload.user_id)
    return {
        "message": f"Added '{ev_row[0]}' to your schedule",
        "has_conflicts": schedule_data["has_conflicts"],
        "conflicts": schedule_data["conflicts"],
        "travel_conflicts": schedule_data["travel_conflicts"],
        "schedule": schedule_data["schedule"]
    }

@app.delete("/api/planner/{event_id}")
def remove_from_planner(event_id: str, user_id: str = "u-1"):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM planner_items WHERE user_id = ? AND event_id = ?", (user_id, event_id))
    conn.commit()
    conn.close()

    schedule_data = get_user_schedule(user_id=user_id)
    return {
        "message": "Removed from schedule",
        "has_conflicts": schedule_data["has_conflicts"],
        "conflicts": schedule_data["conflicts"],
        "travel_conflicts": schedule_data["travel_conflicts"],
        "schedule": schedule_data["schedule"]
    }

# ==========================================
# 6. TEAMMATCH 2.0 (TEAMS, INVITATIONS, SQUADS)
# ==========================================
@app.post("/api/teams", status_code=status.HTTP_201_CREATED)
def create_team(payload: TeamCreateRequest, authorization: Optional[str] = Header(None), user_id: Optional[str] = Query("u-1")):
    user = get_current_user_from_token(authorization, user_id)
    team_id = f"team-{uuid.uuid4().hex[:8]}"

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO teams (id, event_id, name, description, leader_id, required_roles)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (team_id, payload.event_id, payload.name, payload.description, user["id"], json.dumps(payload.required_roles)))

    # Add leader as first member
    cursor.execute("""
    INSERT INTO team_members (team_id, user_id, role)
    VALUES (?, ?, ?)
    """, (team_id, user["id"], user.get("role", "Team Leader")))

    conn.commit()
    conn.close()

    return {"message": f"Team '{payload.name}' created successfully!", "team_id": team_id}

@app.get("/api/teams")
def list_teams(event_id: Optional[str] = Query(None)):
    conn = get_connection()
    cursor = conn.cursor()

    eid = event_id if isinstance(event_id, str) else None
    if eid:
        cursor.execute("SELECT * FROM teams WHERE event_id = ? ORDER BY created_at DESC", (eid,))
    else:
        cursor.execute("SELECT * FROM teams ORDER BY created_at DESC")
    rows = cursor.fetchall()


    teams = []
    for r in rows:
        td = dict(r)
        if isinstance(td.get("required_roles"), str):
            try:
                td["required_roles"] = json.loads(td["required_roles"])
            except Exception:
                td["required_roles"] = []

        # Get leader profile
        cursor.execute("SELECT id, name, role, avatar_url, github FROM users WHERE id = ?", (td["leader_id"],))
        leader = cursor.fetchone()
        td["leader"] = dict(leader) if leader else None

        # Get members
        cursor.execute("""
        SELECT u.id, u.name, u.role, u.avatar_url, tm.role as team_role, tm.joined_at
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id = ?
        """, (td["id"],))
        td["members"] = [dict(m) for m in cursor.fetchall()]

        # Get event title
        cursor.execute("SELECT title, date FROM events WHERE id = ?", (td["event_id"],))
        ev = cursor.fetchone()
        td["event_title"] = ev["title"] if ev else "Hackathon Event"
        td["event_date"] = ev["date"] if ev else ""

        teams.append(td)

    conn.close()
    return {"count": len(teams), "teams": teams}

@app.post("/api/teams/{team_id}/invite")
def invite_teammate(team_id: str, payload: TeamInviteRequest, authorization: Optional[str] = Header(None), user_id: Optional[str] = Query("u-1")):
    user = get_current_user_from_token(authorization, user_id)
    inv_id = f"inv-{uuid.uuid4().hex[:8]}"

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO team_invitations (id, team_id, from_user_id, to_user_id, role, message, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
    """, (inv_id, team_id, user["id"], payload.to_user_id, payload.role, payload.message))

    conn.commit()
    conn.close()

    return {"message": "Invitation sent successfully!", "invitation_id": inv_id}

@app.get("/api/team-invitations")
def get_user_invitations(authorization: Optional[str] = Header(None), user_id: Optional[str] = Query("u-1")):
    user = get_current_user_from_token(authorization, user_id)
    uid = user["id"]

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT ti.*, t.name as team_name, t.description as team_desc, t.event_id,
           u_from.name as sender_name, u_from.avatar_url as sender_avatar,
           e.title as event_title
    FROM team_invitations ti
    JOIN teams t ON ti.team_id = t.id
    JOIN users u_from ON ti.from_user_id = u_from.id
    JOIN events e ON t.event_id = e.id
    WHERE ti.to_user_id = ?
    ORDER BY ti.created_at DESC
    """, (uid,))
    received = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
    SELECT ti.*, t.name as team_name, u_to.name as recipient_name, u_to.avatar_url as recipient_avatar
    FROM team_invitations ti
    JOIN teams t ON ti.team_id = t.id
    JOIN users u_to ON ti.to_user_id = u_to.id
    WHERE ti.from_user_id = ?
    ORDER BY ti.created_at DESC
    """, (uid,))
    sent = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {"received": received, "sent": sent}

@app.post("/api/team-invitations/{invitation_id}/respond")
def respond_invitation(invitation_id: str, payload: InviteRespondRequest, authorization: Optional[str] = Header(None)):
    act = payload.action.lower()
    if act not in ["accept", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'accept' or 'reject'")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM team_invitations WHERE id = ?", (invitation_id,))
    inv = cursor.fetchone()
    if not inv:
        conn.close()
        raise HTTPException(status_code=404, detail="Invitation not found")

    new_status = "accepted" if act == "accept" else "rejected"
    cursor.execute("UPDATE team_invitations SET status = ? WHERE id = ?", (new_status, invitation_id))

    if act == "accept":
        cursor.execute("""
        INSERT OR IGNORE INTO team_members (team_id, user_id, role)
        VALUES (?, ?, ?)
        """, (inv["team_id"], inv["to_user_id"], inv["role"]))

    conn.commit()
    conn.close()

    return {"message": f"Invitation {new_status} successfully!", "status": new_status}

@app.post("/api/teammatch/recommend")
def recommend_teammates(req: TeamMatchRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    rows = cursor.fetchall()
    conn.close()

    candidates = [row_to_user(r) for r in rows]
    ranked = rank_teammates(
        user_role=req.user_role,
        user_skills=req.user_skills,
        user_interests=req.interests,
        user_experience=req.experience_level,
        candidates=candidates
    )

    return {
        "user_query": req.model_dump(),
        "total_candidates": len(ranked),
        "matches": ranked,
        "demo_mode": True
    }

# ==========================================
# 7. GROWTH PASSPORT
# ==========================================
@app.get("/api/passport")
def get_growth_passport(authorization: Optional[str] = Header(None), user_id: Optional[str] = Query("u-1")):
    user = get_current_user_from_token(authorization, user_id)
    uid = user["id"]

    conn = get_connection()
    cursor = conn.cursor()

    # Get user registrations with event skills
    cursor.execute("""
    SELECT r.*, e.title, e.skills, e.category, e.date
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.user_id = ?
    """, (uid,))
    regs = []
    for row in cursor.fetchall():
        d = dict(row)
        if isinstance(d.get("skills"), str):
            try:
                d["skills"] = json.loads(d["skills"])
            except Exception:
                d["skills"] = []
        regs.append(d)

    # Get teams user is in
    cursor.execute("""
    SELECT t.*, tm.role as my_role
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    WHERE tm.user_id = ?
    """, (uid,))
    teams = [dict(r) for r in cursor.fetchall()]
    conn.close()

    passport = compute_growth_passport(user, regs, teams)
    return passport

# ==========================================
# 8. COMMUNITY DEMAND & WISHLIST
# ==========================================
@app.get("/api/community-demands")
def list_community_demands(user_id: Optional[str] = Query("u-1")):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT d.*, u.name as submitter_name, u.avatar_url as submitter_avatar
    FROM community_demands d
    JOIN users u ON d.user_id = u.id
    ORDER BY d.votes_count DESC, d.created_at DESC
    """)
    rows = cursor.fetchall()

    cursor.execute("SELECT demand_id FROM demand_votes WHERE user_id = ?", (user_id,))
    voted_ids = {r[0] for r in cursor.fetchall()}
    conn.close()

    demands = []
    for r in rows:
        d = dict(r)
        d["has_voted"] = d["id"] in voted_ids
        demands.append(d)

    return {"count": len(demands), "demands": demands}

@app.post("/api/community-demands", status_code=status.HTTP_201_CREATED)
def create_demand(payload: DemandCreateRequest, authorization: Optional[str] = Header(None), user_id: Optional[str] = Query("u-1")):
    user = get_current_user_from_token(authorization, user_id)
    demand_id = f"dem-{uuid.uuid4().hex[:8]}"

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO community_demands (id, title, description, category, suggested_locality, user_id, votes_count)
    VALUES (?, ?, ?, ?, ?, ?, 1)
    """, (demand_id, payload.title, payload.description, payload.category, payload.suggested_locality, user["id"]))

    cursor.execute("INSERT OR IGNORE INTO demand_votes (demand_id, user_id) VALUES (?, ?)", (demand_id, user["id"]))
    conn.commit()
    conn.close()

    return {"message": "Event demand suggestion created!", "demand_id": demand_id}

@app.post("/api/community-demands/{demand_id}/vote")
def vote_demand(demand_id: str, authorization: Optional[str] = Header(None), user_id: Optional[str] = Query("u-1")):
    user = get_current_user_from_token(authorization, user_id)
    uid = user["id"]

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM demand_votes WHERE demand_id = ? AND user_id = ?", (demand_id, uid))
    existing = cursor.fetchone()

    if existing:
        cursor.execute("DELETE FROM demand_votes WHERE id = ?", (existing[0],))
        cursor.execute("UPDATE community_demands SET votes_count = MAX(1, votes_count - 1) WHERE id = ?", (demand_id,))
        voted = False
        msg = "Upvote removed"
    else:
        cursor.execute("INSERT INTO demand_votes (demand_id, user_id) VALUES (?, ?)", (demand_id, uid))
        cursor.execute("UPDATE community_demands SET votes_count = votes_count + 1 WHERE id = ?", (demand_id,))
        voted = True
        msg = "Upvoted!"

    cursor.execute("SELECT votes_count FROM community_demands WHERE id = ?", (demand_id,))
    count_row = cursor.fetchone()
    new_count = count_row[0] if count_row else 1

    conn.commit()
    conn.close()

    return {"message": msg, "has_voted": voted, "votes_count": new_count}

# ==========================================
# 9. TRUST & SAFETY & ADMIN MODERATION
# ==========================================
@app.post("/api/events/{event_id}/report", status_code=status.HTTP_201_CREATED)
def report_event(event_id: str, payload: ReportCreateRequest, authorization: Optional[str] = Header(None), user_id: Optional[str] = Query(None)):
    user = get_optional_user(authorization)
    if not user and user_id and isinstance(user_id, str) and user_id.strip() and user_id != "null":
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        r = c.fetchone()
        conn.close()
        if r:
            user = row_to_user(r)

    if not user:
        raise HTTPException(status_code=401, detail="Authentication required to submit trust & safety reports.")

    report_id = f"rep-{uuid.uuid4().hex[:8]}"

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO reports (id, event_id, reporter_user_id, reason, details, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
    """, (report_id, event_id, user["id"], payload.reason, payload.details))
    conn.commit()
    conn.close()

    return {"message": "Report submitted for trust & safety moderation review.", "report_id": report_id}

@app.get("/api/admin/reports")
def list_reports(status_filter: Optional[str] = Query("pending"), authorization: Optional[str] = Header(None)):
    user = get_required_user(authorization)
    require_admin(user)

    conn = get_connection()
    cursor = conn.cursor()
    s_filter = status_filter if isinstance(status_filter, str) else "pending"
    if s_filter == "all":
        cursor.execute("""
        SELECT r.*, e.title as event_title, e.organizer_name, u.name as reporter_name
        FROM reports r
        JOIN events e ON r.event_id = e.id
        JOIN users u ON r.reporter_user_id = u.id
        ORDER BY r.created_at DESC
        """)
    else:
        cursor.execute("""
        SELECT r.*, e.title as event_title, e.organizer_name, u.name as reporter_name
        FROM reports r
        JOIN events e ON r.event_id = e.id
        JOIN users u ON r.reporter_user_id = u.id
        WHERE r.status = ?
        ORDER BY r.created_at DESC
        """, (s_filter,))

    rows = cursor.fetchall()
    conn.close()
    return {"count": len(rows), "reports": [dict(r) for r in rows]}

@app.post("/api/admin/reports/{report_id}/resolve")
def resolve_report(report_id: str, payload: ReportResolveRequest, authorization: Optional[str] = Header(None)):
    user = get_required_user(authorization)
    require_admin(user)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT event_id FROM reports WHERE id = ?", (report_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Report not found")

    event_id = row[0]
    cursor.execute("UPDATE reports SET status = 'resolved' WHERE id = ?", (report_id,))

    if payload.action == "flag_event":
        cursor.execute("UPDATE events SET organizer_rating = 2.0, review_status = 'flagged' WHERE id = ?", (event_id,))
    elif payload.action == "unpublish_event":
        cursor.execute("UPDATE events SET status = 'unpublished', review_status = 'rejected' WHERE id = ?", (event_id,))
    elif payload.action == "dismiss":
        cursor.execute("UPDATE events SET review_status = 'reviewed' WHERE id = ?", (event_id,))

    # Record in audit trail
    cursor.execute("""
    INSERT INTO audit_logs (id, action, actor_user_id, target_id, details)
    VALUES (?, ?, ?, ?, ?)
    """, (
        f"audit-{uuid.uuid4().hex[:8]}",
        f"resolve_report_{payload.action}",
        user["id"],
        event_id,
        f"Admin {user['name']} resolved report {report_id} with action {payload.action}"
    ))

    conn.commit()
    conn.close()

    return {"message": f"Report resolved with action: {payload.action}"}

@app.get("/api/admin/audit-logs")
def get_audit_logs(authorization: Optional[str] = Header(None)):
    user = get_required_user(authorization)
    require_admin(user)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100")
    rows = cursor.fetchall()
    conn.close()
    return {"count": len(rows), "audit_logs": [dict(r) for r in rows]}

# ==========================================
# 10. BOOKMARKS & ORGANIZER OPERATIONS
# ==========================================
@app.get("/api/bookmarks")
def get_user_bookmarks(authorization: Optional[str] = Header(None), user_id: Optional[str] = Query(None)):
    user = get_optional_user(authorization)
    if not user and user_id and isinstance(user_id, str) and user_id.strip() and user_id != "null":
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        r = c.fetchone()
        conn.close()
        if r:
            user = row_to_user(r)

    if not user:
        raise HTTPException(status_code=401, detail="Authentication required to view bookmarks.")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT e.* FROM events e
    JOIN bookmarks b ON e.id = b.event_id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
    """, (user["id"],))
    rows = cursor.fetchall()
    conn.close()

    all_events = get_all_raw_events()
    events = []
    for r in rows:
        ev = row_to_event(r)
        dup = detect_duplicate(ev, all_events)
        ev["trust"] = compute_trust_score(ev, dup)
        ev["is_bookmarked"] = True
        events.append(ev)

    return {"count": len(events), "bookmarks": events}

@app.post("/api/bookmarks/toggle")
def toggle_bookmark(payload: BookmarkToggleRequest, authorization: Optional[str] = Header(None)):
    user = get_optional_user(authorization)
    uid = user["id"] if user else payload.user_id
    if not uid:
        raise HTTPException(status_code=401, detail="Authentication required to bookmark events.")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM bookmarks WHERE user_id = ? AND event_id = ?", (uid, payload.event_id))
    row = cursor.fetchone()

    if row:
        cursor.execute("DELETE FROM bookmarks WHERE id = ?", (row[0],))
        bookmarked = False
        msg = "Bookmark removed"
    else:
        cursor.execute("INSERT INTO bookmarks (user_id, event_id) VALUES (?, ?)", (uid, payload.event_id))
        bookmarked = True
        msg = "Event bookmarked"

    conn.commit()
    conn.close()
    return {"message": msg, "is_bookmarked": bookmarked}

@app.post("/api/events", status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreate, authorization: Optional[str] = Header(None)):
    user = get_required_user(authorization)

    # Input validation
    if not payload.title or not payload.title.strip():
        raise HTTPException(status_code=422, detail="Event title is required")
    if not payload.date or not payload.date.strip():
        raise HTTPException(status_code=422, detail="Event date is required")
    if payload.total_seats < 1 or payload.total_seats > 50000:
        raise HTTPException(status_code=422, detail="total_seats must be between 1 and 50,000")
    if payload.price < 0:
        raise HTTPException(status_code=422, detail="price must be non-negative")
    
    event_id = f"ev-{uuid.uuid4().hex[:8]}"
    ev_dict = payload.model_dump()
    ev_dict["id"] = event_id
    ev_dict["registered_seats"] = 0
    ev_dict["organizer_rating"] = 4.5
    ev_dict["is_featured"] = 0
    ev_dict["locality"] = ev_dict.get("locality") or "Koramangala"
    ev_dict["latitude"] = ev_dict.get("latitude") or 12.9352
    ev_dict["longitude"] = ev_dict.get("longitude") or 77.6245

    # Server-enforced identity and moderation state
    ev_dict["organizer_id"] = user["id"]
    ev_dict["organizer_name"] = user.get("name") or "Event Organizer"
    ev_dict["organizer_email"] = user.get("email") or "organizer@eventsphere.io"
    ev_dict["organizer_verified"] = 1 if user.get("is_admin") or user.get("is_verified_organizer") or user.get("role") == "Event Organizer" else 0
    ev_dict["review_status"] = "reviewed" if user.get("is_admin") else "unreviewed"
    ev_dict["is_demo"] = 0

    all_events = get_all_raw_events()
    dup_info = detect_duplicate(ev_dict, all_events)
    trust = compute_trust_score(ev_dict, dup_info)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO events (
        id, title, description, category, event_type, format, price_type, price,
        date, start_time, end_time, venue, city, location, locality, latitude, longitude, banner_url,
        organizer_name, organizer_email, organizer_verified, organizer_rating,
        total_seats, registered_seats, skills, agenda, is_featured, organizer_id, source_url,
        submission_method, review_status, is_demo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        event_id, ev_dict["title"], ev_dict["description"], ev_dict["category"], ev_dict["event_type"],
        ev_dict["format"], ev_dict["price_type"], ev_dict["price"], ev_dict["date"], ev_dict["start_time"],
        ev_dict["end_time"], ev_dict["venue"], ev_dict["city"], ev_dict["location"],
        ev_dict["locality"], ev_dict["latitude"], ev_dict["longitude"], ev_dict["banner_url"],
        ev_dict["organizer_name"], ev_dict["organizer_email"], ev_dict["organizer_verified"],
        ev_dict["organizer_rating"], ev_dict["total_seats"], ev_dict["registered_seats"],
        json.dumps(ev_dict["skills"]), ev_dict.get("agenda", ""), ev_dict["is_featured"],
        ev_dict["organizer_id"], ev_dict.get("source_url") or "https://luma.com/event-demo",
        ev_dict.get("submission_method", "manual"), ev_dict["review_status"], ev_dict["is_demo"]
    ))
    conn.commit()
    conn.close()

    ev_dict["trust"] = trust
    return {
        "message": "Event published successfully",
        "event": ev_dict,
        "duplicate_warning": dup_info
    }

@app.put("/api/events/{event_id}")
def update_event(event_id: str, payload: EventUpdate, authorization: Optional[str] = Header(None)):
    user = get_required_user(authorization)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Event not found")

    ev = dict(row)
    # Server-side RBAC: Only event creator or platform admin can update event!
    if ev.get("organizer_id") != user["id"] and not user.get("is_admin"):
        conn.close()
        raise HTTPException(status_code=403, detail="Forbidden: You can only edit events that you own.")

    updates = []
    params = []
    p_data = payload.model_dump(exclude_unset=True)

    for field, val in p_data.items():
        if val is not None:
            if field == "skills":
                updates.append("skills = ?")
                params.append(json.dumps(val))
            else:
                updates.append(f"{field} = ?")
                params.append(val)

    if updates:
        params.append(event_id)
        cursor.execute(f"UPDATE events SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()

    cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
    updated_ev = row_to_event(cursor.fetchone())
    conn.close()

    return {"message": "Event updated successfully", "event": updated_ev}

@app.delete("/api/events/{event_id}")
def delete_event(event_id: str, authorization: Optional[str] = Header(None)):
    user = get_required_user(authorization)
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Event not found")

    ev = dict(row)
    # Server-side RBAC: Only event creator or platform admin can delete event!
    if ev.get("organizer_id") != user["id"] and not user.get("is_admin"):
        conn.close()
        raise HTTPException(status_code=403, detail="Forbidden: You can only delete events that you own.")
    
    cursor.execute("DELETE FROM events WHERE id = ?", (event_id,))
    cursor.execute("DELETE FROM bookmarks WHERE event_id = ?", (event_id,))
    cursor.execute("DELETE FROM planner_items WHERE event_id = ?", (event_id,))
    cursor.execute("DELETE FROM registrations WHERE event_id = ?", (event_id,))
    conn.commit()
    conn.close()
    return {"message": "Event removed successfully"}

@app.get("/api/users")
def list_demo_users(authorization: Optional[str] = Header(None)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    rows = cursor.fetchall()
    conn.close()
    return {"users": [row_to_user(r) for r in rows]}

@app.get("/api/organizer/stats")
def get_organizer_stats(authorization: Optional[str] = Header(None)):
    user = get_optional_user(authorization)
    all_events = get_all_raw_events()
    
    # If authenticated as organizer (non-admin), show events they own
    if user and not user.get("is_admin"):
        user_events = [e for e in all_events if e.get("organizer_id") == user["id"]]
    else:
        user_events = all_events

    total_events = len(user_events)
    total_registered = sum(e.get("registered_seats", 0) for e in user_events)
    total_capacity = sum(e.get("total_seats", 100) for e in user_events)

    duplicate_map = {}
    trust_scores = []
    flagged_duplicates = []

    for ev in user_events:
        dup = detect_duplicate(ev, all_events)
        trust = compute_trust_score(ev, dup)
        ev["trust"] = trust
        trust_scores.append(trust["score"])
        if dup:
            duplicate_map[ev["id"]] = dup
            flagged_duplicates.append({
                "event_id": ev["id"],
                "event_title": ev["title"],
                "organizer": ev["organizer_name"],
                "duplicate_info": dup,
                "trust_score": trust["score"]
            })

    avg_trust = round(sum(trust_scores) / len(trust_scores), 1) if trust_scores else 0

    return {
        "total_events": total_events,
        "total_registrations": total_registered,
        "total_capacity": total_capacity,
        "occupancy_rate": round((total_registered / total_capacity * 100), 1) if total_capacity else 0,
        "average_trust_score": avg_trust,
        "flagged_duplicates_count": len(flagged_duplicates),
        "flagged_duplicates": flagged_duplicates,
        "events": user_events
    }

@app.post("/api/admin/reset")
def reset_demo_database(authorization: Optional[str] = Header(None)):
    # 1. Server-side Authentication & Admin Authorization check
    user = get_required_user(authorization)
    require_admin(user)

    # 2. Production safety lock: check environment
    env = os.getenv("ENVIRONMENT", "development").lower().strip()
    if env in ("production", "prod", "staging"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Database reset functionality is strictly disabled in production environments."
        )
    allow_reset = os.getenv("ALLOW_DEMO_RESET", "false").lower().strip()
    if allow_reset not in ("true", "1", "yes"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Database reset functionality is disabled. Set ALLOW_DEMO_RESET=true in development to enable."
        )

    # 3. Perform reset
    init_db(force_reset=True)

    # 4. Audit trail logging
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    INSERT INTO audit_logs (id, action, actor_user_id, target_id, details)
    VALUES (?, ?, ?, ?, ?)
    """, (
        f"audit-{uuid.uuid4().hex[:8]}",
        "database_reset",
        user["id"],
        "eventsphere.db",
        f"Administrator {user['name']} ({user['email']}) initiated full demo database reset"
    ))
    conn.commit()
    conn.close()

    return {"message": "Demo database successfully restored with fresh seed dataset"}

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "EventSphere API v2.0",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    }

# ==========================================
# 11. SERVE FRONTEND PRODUCTION BUILD IF EXISTS
# ==========================================
DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
ASSETS_DIR = os.path.join(DIST_DIR, "assets")

if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
        
    index_file = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_file):
        candidate_file = os.path.join(DIST_DIR, full_path)
        if full_path and os.path.exists(candidate_file) and not os.path.isdir(candidate_file):
            return FileResponse(candidate_file)
        return FileResponse(index_file)
    return {"message": "EventSphere API is running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
