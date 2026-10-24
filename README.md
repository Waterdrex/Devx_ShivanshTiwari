# EventSphere 🌐⚡
> **Hyperlocal Event Discovery & Community Engagement Platform**  
> *Built for VecnaVerse National Level Hackathon — Problem Statement 1*

EventSphere bridges the gap between ambitious developers, designers, and local tech ecosystems. Beyond static directories, EventSphere provides **Algorithmic Trust Intelligence** (explainable 0–100 authenticity scoring with duplicate clone detection and verified host identity), **Multi-City & Hyperlocal Distance Discovery** (great-circle Haversine coordinates and travel conflict warnings), an **Opportunity Radar** (personalized goal and skill matching with budget enforcement), an **Organizer Hub with Community Gap Radar** (identifying unmet local demand), **Atomic Digital Passes** (concurrency-safe capacity reservation), an **Algorithmic TeamMatch Engine** (assembling complementary hackathon teams), and a **Growth Passport** (tracking developer XP and verified skill badges).

---

## 🌟 Tech Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Leaflet / OpenStreetMap
- **Backend**: Python FastAPI, SQLite, Pydantic v2, Uvicorn, PBKDF2-HMAC-SHA256 Password Hashing
- **Security**: Server-Side RBAC, Session Tokens, In-Memory Sliding-Window Rate Limiting, Production Lockout
- **Architecture**: REST API with single-port unified deployment and dual-port dev proxy

---

## 🔒 Security & Architecture Hardening (P0 / P1)

### 1. Server-Side Authentication & Session Validation
- **No Client Trust**: Client-supplied `user_id`, roles, or organizer IDs are never accepted as proof of authorization. All protected requests strictly validate the `Authorization: Bearer <token>` session header on the server.
- **Removed Dangerous Silent Fallbacks**: Eliminated previous default-admin fallbacks that granted administrative privileges to unauthenticated requests.
- **Sliding-Window Rate Limiting**: Added in-memory rate limiting to `POST /api/auth/login` (maximum 5 failed attempts per IP within a 60-second window) to block brute-force attacks.
- **Secure Password Storage**: Passwords hashed using PBKDF2-HMAC-SHA256 with cryptographically random 16-byte salts.

### 2. Role-Based Access Control (RBAC) & Ownership
- **Attendees**: Can view, register for events, manage their own bookmarks, cancel only their own tickets, and update their own profile.
- **Event Organizers**: Can create events, edit only events they own (`PUT /api/events/{id}`), delete only events they own (`DELETE /api/events/{id}`), and view their scoped organizer metrics.
- **Platform Administrators**: Can inspect moderation queues, review user reports, unpublish scam listings, inspect audit logs, and trigger demo database resets in non-production environments.

### 3. Production Safety Lock for Administrative Endpoints
- `POST /api/admin/reset` requires verified platform administrator credentials.
- In production (`ENVIRONMENT=production` and `ALLOW_DEMO_RESET!=true`), the endpoint is strictly disabled and returns `403 Forbidden`.

### 4. Concurrency-Safe Atomic Capacity Reservation
- Registration enforces atomic seat decrement in SQLite:
  ```sql
  UPDATE events
  SET registered_seats = registered_seats + 1
  WHERE id = ? AND registered_seats < total_seats AND status != 'unpublished'
  ```
- Prevents race conditions and over-registration beyond `total_seats`. Duplicate registrations return the existing ticket without double-counting seats.

### 5. Input Validation & Abuse Prevention
- Validated via Pydantic v2 models:
  - `price >= 0.0`
  - `total_seats >= 1`
  - Safe URL scheme validation for `source_url` (rejects `javascript:`, `data:`, and malformed URLs)
  - `date` format validated to ISO `YYYY-MM-DD`
- Passwords and token secrets are excluded from public responses.

---

## 🚀 Key Modules & PS1 Alignment

### 1. Multi-City & Hyperlocal Distance Discovery
- **Supported Cities**: Bengaluru, Mumbai, Delhi NCR, Hyderabad, and Pune.
- **Haversine Distance Engine**: Computes true great-circle distance between user GPS coordinates and event venues.
- **Distance Radius Filter**: Filter events within 2 km, 5 km, 10 km, or 25 km of your location.
- **Interactive OpenStreetMap**: Real Leaflet map view showing cluster markers and event venues.

### 2. Opportunity Radar (Personalized Matching)
- **4-Factor Explainable Scoring (0–100%)**:
  - *Goal Alignment (35%)*: Matches event format to developer goals (*Win Hackathons*, *AI Upskilling*, *Find Teammates*).
  - *Skill Synergy (30%)*: Evaluates technical stack overlap (e.g. React, PyTorch, FastAPI).
  - *Domain Fit (20%)*: Aligns with developer interests (Generative AI, Web3, HealthTech).
  - *Practical Proximity (15%)*: Proximity to attendee's locality and free admission.
- **Budget Filtering**: Hard constraint enforcement (`max_budget`). Over-budget events are penalized and flagged.

### 3. Trust Intelligence & Safety
- **Truthful Identity Verification**: Removed misleading "KYC" claims; replaced with transparent **Host Identity Status** and verifiable signal breakdowns.
- **Duplicate & Clone Detection**: Lexical title similarity and venue matching penalizes duplicate listings and flags mirror events.
- **Community Reporting & Moderation**: Attendees can report suspicious listings, and administrators can dismiss, flag with warning, or unpublish.

### 4. Organizer Hub & Community Gap Radar
- **Community Gap Radar**: Aggregates community wishlist demands vs. current catalog supply to identify underserved localities and niches.
- **1-Click "Host Event for this Demand"**: Organizers can launch an event draft directly from high-demand community gaps.
- **Full Lifecycle Management**: Create, edit, and delete event listings with real-time occupancy and trust metrics.

### 5. Smart Planner & Transit Conflict Intelligence
- **Time Overlap Detection**: Detects schedule overlaps and suggests non-conflicting alternatives.
- **Physical Transit Conflict Engine**: Warns attendees when back-to-back offline events in different localities cannot be reached within the available transit buffer.

### 6. TeamMatch 2.0 & Growth Passport
- **Squad Formation**: Form hackathon squads, specify needed skill sets, and invite complementary teammates.
- **Growth Passport**: Earn developer XP across 4 tiers (*Emerging Explorer* to *Ecosystem Champion*) with verified skill badges.

---

## 👥 Evaluator Demo Personas

For evaluator convenience, 1-click quick login buttons are available in the sign-in modal:

| Persona | Name | Email | Password | Role / Access Level |
|---|---|---|---|---|
| **Attendee** | Aarav Sharma | `aarav.sharma@demo.eventsphere.io` | `password123` | Standard Attendee (Passes, Planner, TeamMatch) |
| **Organizer** | Karan Verma | `organizer@demo.eventsphere.io` | `password123` | Event Host (Host Hub, Event Editing, Gaps) |
| **Admin** | System Admin | `admin@demo.eventsphere.io` | `password123` | Platform Administrator (Moderation, Audits, Reset) |
| **Teammate** | Priya Nair | `priya.nair@demo.eventsphere.io` | `password123` | Backend Developer (TeamMatch candidate) |

---

## 🛠️ Running the Application

### Option A: Unified Single-Port Run (Fastest)
The FastAPI backend serves both the REST API and the pre-built React production frontend from port 8000.

1. **Navigate to the backend directory**:
   ```powershell
   cd d:\EventSphere\backend
   ```

2. **Start the unified server**:
   ```powershell
   python main.py
   ```

3. **Open in browser**:
   👉 **`http://127.0.0.1:8000`**

---

### Option B: Development Mode (Dual Port with Hot Reload)

1. **Terminal 1: Start Backend**
   ```powershell
   cd d:\EventSphere\backend
   python -m uvicorn main:app --reload --port 8000
   ```
   *FastAPI Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`*

2. **Terminal 2: Start Frontend**
   ```powershell
   cd d:\EventSphere\frontend
   npm run dev
   ```
   *Vite Frontend available at: `http://localhost:5173`*

---

## 🧪 Verification Test Suites

EventSphere includes 3 comprehensive test suites verifying database integrity, security posture, RBAC, and PS1 requirements:

```powershell
cd d:\EventSphere\backend

# 1. Full Security & PS1 Regression Suite (12 tests)
python test_security_and_ps1.py

# 2. MVP End-to-End Validation Suite
python test_mvp.py

# 3. Stage 1 & Upgrades Suite
python test_upgrades.py
```

### Verified Test Summary:
- `test_security_and_ps1.py`: **12/12 PASSED (100%)**
  1. Unauthenticated administrative requests rejected (401)
  2. Non-admin users cannot access admin endpoints (403)
  3. Organizers cannot edit or delete other organizers' events (403)
  4. Attendees cannot view or cancel other attendees' passes (403)
  5. Invalid input (negative prices, 0 seats, unsafe URLs, bad dates) rejected (422)
  6. Capacity limits prevent over-registration atomically
  7. Duplicate registrations prevented
  8. Authorized organizer and attendee workflows functioning
  9. Legitimate administrator workflow functioning
  10. Destructive reset locked in production environments
  11. Multi-city and coordinate distance filtering functioning
  12. Community Gap Radar calculating demand vs supply
- `test_mvp.py`: **100% PASSED**
- `test_upgrades.py`: **100% PASSED**
- Frontend Build (`npm run build`): **0 errors (100% PASSED)**
