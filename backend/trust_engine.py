import re
from typing import Dict, Any, List, Optional, Tuple

def tokenize(text: str) -> set:
    words = re.findall(r'\w+', text.lower())
    stop_words = {'the', 'a', 'an', 'and', 'or', 'in', 'at', 'of', 'for', 'to', 'on', 'with', 'by', '2025', '2026', 'event'}
    return {w for w in words if w not in stop_words and len(w) > 2}

def compute_similarity(text1: str, text2: str) -> float:
    tokens1 = tokenize(text1)
    tokens2 = tokenize(text2)
    if not tokens1 or not tokens2:
        return 0.0
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    return len(intersection) / len(union)

def detect_duplicate(candidate: Dict[str, Any], existing_events: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    candidate_id = candidate.get("id")
    cand_title = candidate.get("title", "")
    cand_date = candidate.get("date", "")
    cand_city = candidate.get("city", "").lower()
    cand_venue = candidate.get("venue", "").lower()
    cand_verified = bool(candidate.get("organizer_verified", False))
    cand_created = candidate.get("created_at", "")

    for ev in existing_events:
        if candidate_id and ev.get("id") == candidate_id:
            continue
        
        ev_title = ev.get("title", "")
        ev_date = ev.get("date", "")
        ev_city = ev.get("city", "").lower()
        ev_venue = ev.get("venue", "").lower()
        ev_verified = bool(ev.get("organizer_verified", False))

        sim = compute_similarity(cand_title, ev_title)
        same_date = cand_date and ev_date and cand_date == ev_date
        same_location = (cand_city and ev_city and cand_city == ev_city) or (cand_venue and ev_venue and cand_venue == ev_venue)

        # If candidate is an authentic verified organizer and matched event is unverified,
        # candidate is NOT the duplicate (the unverified one is).
        if cand_verified and not ev_verified:
            continue

        # If title is very close and on same date
        if sim >= 0.60 and same_date:
            return {
                "duplicate_event_id": ev.get("id"),
                "matched_title": ev_title,
                "similarity": round(sim * 100, 1),
                "reason": f"Title matches '{ev_title}' ({round(sim*100)}% lexical similarity) scheduled on the same date ({cand_date})."
            }
        
        # If title similarity is extremely high (> 0.85) even without same location
        if sim >= 0.85:
            return {
                "duplicate_event_id": ev.get("id"),
                "matched_title": ev_title,
                "similarity": round(sim * 100, 1),
                "reason": f"Very high title similarity ({round(sim*100)}%) with existing event '{ev_title}'."
            }

    return None

def compute_trust_score(event: Dict[str, Any], duplicate_info: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    score = 0
    signals = []

    # 1. Organizer Profile & Verification (Max 35)
    organizer_name = event.get("organizer_name", "")
    organizer_email = event.get("organizer_email", "")
    organizer_verified = bool(event.get("organizer_verified", False))
    organizer_rating = float(event.get("organizer_rating", 4.0))

    if organizer_verified:
        score += 20
        signals.append({
            "name": "Verified Organizer Identity",
            "score": 20,
            "max": 20,
            "status": "passed",
            "description": "Organizer has completed official institutional / platform KYC verification."
        })
    else:
        signals.append({
            "name": "Organizer Identity Verification",
            "score": 5,
            "max": 20,
            "status": "warning",
            "description": "Community organizer without formal government/institution ID check."
        })
        score += 5

    if organizer_email and ("@" in organizer_email and not organizer_email.endswith("@tempmail.com")):
        score += 15
        domain = organizer_email.split("@")[-1]
        signals.append({
            "name": "Legitimate Contact Domain",
            "score": 15,
            "max": 15,
            "status": "passed",
            "description": f"Verified organizational contact address (@{domain})."
        })
    else:
        signals.append({
            "name": "Contact Domain Verification",
            "score": 0,
            "max": 15,
            "status": "failed",
            "description": "Unverified or missing organizer contact email."
        })

    # 2. Event Specification Completeness (Max 35)
    desc = event.get("description", "")
    agenda = event.get("agenda", "")
    venue = event.get("venue", "")

    if len(desc) >= 140:
        score += 15
        signals.append({
            "name": "Comprehensive Event Overview",
            "score": 15,
            "max": 15,
            "status": "passed",
            "description": "Full description detailing objectives, schedule, and criteria provided."
        })
    elif len(desc) >= 40:
        score += 8
        signals.append({
            "name": "Moderate Event Description",
            "score": 8,
            "max": 15,
            "status": "warning",
            "description": "Brief description provided; more operational details recommended."
        })
    else:
        signals.append({
            "name": "Sparse Event Description",
            "score": 0,
            "max": 15,
            "status": "failed",
            "description": "Description is too brief to verify scope and legitimacy."
        })

    if agenda and len(str(agenda)) > 20:
        score += 10
        signals.append({
            "name": "Structured Agenda & Timeline",
            "score": 10,
            "max": 10,
            "status": "passed",
            "description": "Explicit phase-by-phase schedule and milestones declared."
        })
    else:
        signals.append({
            "name": "Structured Agenda",
            "score": 0,
            "max": 10,
            "status": "failed",
            "description": "No formal agenda or milestones outlined."
        })

    if venue and len(venue) > 5 and venue.lower() not in ["tbd", "to be announced", "somewhere"]:
        score += 10
        signals.append({
            "name": "Validated Venue / Platform",
            "score": 10,
            "max": 10,
            "status": "passed",
            "description": f"Clear venue/location specified: {venue}"
        })
    else:
        signals.append({
            "name": "Validated Venue / Platform",
            "score": 0,
            "max": 10,
            "status": "failed",
            "description": "Physical venue or official streaming link not yet designated."
        })

    # 3. Community Engagement & History (Max 30)
    total_seats = int(event.get("total_seats", 100))
    registered_seats = int(event.get("registered_seats", 0))

    if registered_seats > 5:
        score += 15
        signals.append({
            "name": "Active Peer Registrations",
            "score": 15,
            "max": 15,
            "status": "passed",
            "description": f"{registered_seats} registered attendees with verified community activity."
        })
    else:
        score += 5
        signals.append({
            "name": "Peer Registrations",
            "score": 5,
            "max": 15,
            "status": "warning",
            "description": "Early listing with few existing registrations."
        })

    if organizer_rating >= 4.5:
        score += 15
        signals.append({
            "name": "Historical Host Rating",
            "score": 15,
            "max": 15,
            "status": "passed",
            "description": f"Excellent organizer reputation index ({organizer_rating}/5.0)."
        })
    elif organizer_rating >= 3.5:
        score += 10
        signals.append({
            "name": "Historical Host Rating",
            "score": 10,
            "max": 15,
            "status": "passed",
            "description": f"Reliable host track record ({organizer_rating}/5.0)."
        })
    else:
        score += 5
        signals.append({
            "name": "Historical Host Rating",
            "score": 5,
            "max": 15,
            "status": "warning",
            "description": "Limited historical event feedback on this organizer."
        })

    # Deductions if duplicate detected
    duplicate_penalty = 0
    if duplicate_info:
        duplicate_penalty = 30
        score = max(5, score - duplicate_penalty)
        signals.append({
            "name": "Duplicate Listing Flag",
            "score": -duplicate_penalty,
            "max": 0,
            "status": "failed",
            "description": f"Flagged as suspected duplicate of #{duplicate_info.get('duplicate_event_id')}: {duplicate_info.get('reason')}"
        })

    # Tier designation
    if score >= 85:
        tier = "High Trust"
        badge_color = "emerald"
    elif score >= 65:
        tier = "Moderate Trust"
        badge_color = "amber"
    else:
        tier = "Needs Review"
        badge_color = "rose"

    return {
        "score": min(100, max(0, score)),
        "tier": tier,
        "badge_color": badge_color,
        "signals": signals,
        "is_duplicate_flagged": bool(duplicate_info),
        "duplicate_info": duplicate_info,
        "demo_disclaimer": "Trust indicators and verification signals use algorithmic evaluation with demonstration credentials."
    }
