# EventSphere 🌐⚡
> **Hyperlocal Event Discovery & Community Engagement Platform**  
> *Built for Hackathons — Full-Stack Production-Ready Platform*

EventSphere bridges the gap between ambitious developers, designers, and local tech ecosystems. Beyond generic listing directories, EventSphere provides **Trust Intelligence** (explainable 0–100 authenticity scoring with duplicate clone detection), an **Algorithmic TeamMatch 2.0 Engine** (assembling complementary hackathon teams and managing squads), an **Opportunity Radar** (personalized goal and skill matching), **Hyperlocal Mobility Intelligence** (Bengaluru tech corridor mapping and physical travel conflict warnings), and a **Growth Passport** (tracking developer XP and verified skill badges).

---

## 🌟 Tech Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Python FastAPI, SQLite, Pydantic v2, Uvicorn, PBKDF2 Password Hashing
- **Architecture**: REST API with single-port unified deployment and dual-port dev proxy

---

## 🚀 Key Features

### 1. Authentication & Persistent Sessions
- **Secure Password Hashing**: PBKDF2-HMAC-SHA256 with cryptographically random salts.
- **Session Tokens**: 32-byte cryptographically secure hexadecimal tokens stored in SQLite and persisted in `localStorage`.
- **1-Click Quick Demo Sign-In**: Instant login buttons for seeded demo profiles (*Aarav Sharma*, *Priya Nair*, *Devansh Patel*, *Ananya Deshmukh*).
- **Full Signup & Login Flow**: Custom registration with technical role, locality, goals, and skill tags.

### 2. Multi-Step Event Registration & "My Passes" Dashboard
- **3-Step Attendee Registration Flow**:
  1. *Attendee Details*: Name, email, phone, t-shirt size (S/M/L/XL), dietary preferences, and GitHub / LinkedIn link.
  2. *Review & Confirmation*: Order breakdown with free pass terms.
  3. *Digital Ticket Pass*: Stylized printable pass with unique ticket code (`ES-XXXX-XXXXXX`), QR verification placeholder, venue, and date.
- **Capacity Management**: Live seat counters decrement available capacity and prevent duplicate registrations.
- **My Passes Hub**: View all confirmed passes, inspect ticket details, or cancel registrations to release seats back to the community.

### 3. Opportunity Radar (AI Personalized Recommendations)
- **4-Factor Explainable Match Scoring (0–100%)**:
  - *Goal Alignment (35%)*: Matches event format and focus to developer goals (*Win Hackathons*, *AI Upskilling*, *Find Co-founders*).
  - *Skill Synergy (30%)*: Evaluates technical stack overlap (e.g. React, PyTorch, FastAPI).
  - *Domain Fit (20%)*: Aligns with developer interests (Generative AI, Web3, HealthTech).
  - *Practicality (15%)*: Weights free admission and same-locality proximity.
- **Dynamic Filters**: Filter recommendations by maximum budget.

### 4. Hyperlocal Tech Corridor Discovery & Transit Intelligence
- **Interactive SVG Map**: Visualizes 9 prominent Bengaluru tech clusters (*Koramangala, Indiranagar, HSR Layout, Whitefield, Electronic City, Central Bangalore, Jayanagar, Bellandur, Yelahanka*) with interactive pins and live counts.
- **List / Map View Toggle**: Switch effortlessly between the responsive card grid and the interactive corridor map.
- **Physical Transit Conflict Engine**: Calculates Haversine distance and real-world road factors between back-to-back same-day events. If transit time exceeds the schedule window (e.g., Koramangala to Whitefield in 15 mins), the planner raises a **Physical Travel Conflict Warning**.

### 5. TeamMatch 2.0 (Squads & Live Invitations)
- **Role Complementarity**: Pairs users with non-redundant team members (e.g., Frontend matched with Backend and AI/ML).
- **Squad Creation**: Create a hackathon team for any upcoming event, specify needed roles, and invite recommended developers.
- **Live Invitations Dashboard**: Review incoming squad invitations with 1-click **Accept** (joining squad) or **Decline**.

### 6. Trust Intelligence & Admin Moderation Queue
- **Explainable 0–100 Authenticity Scoring**: Every event receives an auditable trust score based on 7 transparent signals.
- **Clickable "Why this score?" Breakdown**: Interactive modal detailing earned vs. maximum points for every signal.
- **Community Reporting**: Community members can flag suspected scams, duplicate clone listings, or venue discrepancies.
- **Admin Moderation Queue**: Review reported listings with administrative actions: **Dismiss (Authentic)**, **Flag with Warning Banner**, or **Unpublish Listing**.

### 7. Growth Passport & Verified Developer XP
- **Developer XP & Tier Progression**: Earn XP through registrations, team formations, and hackathon victories. Progress across 4 tiers (*Tier 1: Emerging Explorer* to *Tier 4: Ecosystem Champion*).
- **Verified Skills Cloud**: Track technical skills endorsed through completed event milestones.
- **Achievement Badges**: Earn dynamic badges (*First Blood*, *Hackathon Legend*, *Hyperlocal Pioneer*, *Synergy Builder*, *Community Guardian*).

### 8. Community Demand & Local Event Wishlist
- **Crowdsourced Wishlist**: Ambitious developers suggest events they want to see hosted in their locality.
- **Live Upvoting**: Community members upvote demands, signaling host interest to local tech organizers.

---

## 🛠️ Windows Setup & Running Instructions

### Option A: Unified Run (Fastest — Single Port)
The FastAPI backend serves both the REST API and the pre-built React production frontend from one server.

1. **Open PowerShell / Command Prompt** in the project directory:
   ```powershell
   cd vecna
   ```

2. **Install Python backend dependencies**:
   ```powershell
   pip install fastapi uvicorn pydantic
   ```

3. **Start the server**:
   ```powershell
   cd backend
   python main.py
   ```

4. **Open in browser**:
   👉 **`http://127.0.0.1:8000`**

---

### Option B: Development Mode (Dual Port with Hot Reload)
Run backend and frontend independently with Vite's proxy for live code editing.

1. **Terminal 1: Start Backend**
   ```powershell
   cd vecna\backend
   python -m uvicorn main:app --reload --port 8000
   ```
   *FastAPI Docs available at: `http://127.0.0.1:8000/docs`*

2. **Terminal 2: Start Frontend**
   ```powershell
   cd vecna\frontend
   npm install
   npm run dev
   ```
   *Frontend dev server available at: `http://localhost:5173`*

---

## 🧪 Running the Verification Test Suites

To verify all database schemas, seed data, trust calculations, duplicate detection, schedule conflict alerts, TeamMatch algorithms, and stage upgrades:

```powershell
cd vecna\backend
python test_mvp.py
python test_upgrades.py
```

Expected output:
```text
=== STARTING EVENTSPHERE MVP END-TO-END VALIDATION ===
[OK] Database Initialized: 16 events seeded, 8 demo users seeded
[OK] Event Discovery Working: Found 'HyperHack 2026: AI & Agents Global Hackathon'
[OK] Trust Intelligence Working: Score = 100/100, Tier = 'High Trust'
[OK] Duplicate Detection Working: Mirror Event flagged = True, Score penalized to 5/100
[OK] Smart Planner Working: Overlap of 240 mins detected, recommended alternative suggested
[OK] TeamMatch Algorithm Working: Priya Nair (Backend) matches with 96% compatibility
[OK] Organizer Event Publishing Working: Created and validated new event
ALL FULL-STACK MVP VERIFICATION TESTS PASSED SUCCESSFULLY!

=== TESTING EVENTSPHERE STAGE 1 & FULL UPGRADES ===
[OK] Auth Login Working: User 'Aarav Sharma' logged in
[OK] Auth Signup Working: User created
[OK] Event Registration Working: Registration saved
[OK] My Events Dashboard Working: Found registered passes with ticket code ES-...
[OK] Opportunity Radar Working: Radar score & 4-factor explanation
[OK] Hyperlocal Discovery Working: 9 active clusters mapped
[OK] TeamMatch 2.0 Team Creation Working: Team created & invitation sent
[OK] Growth Passport Working: Developer XP (1410 XP, Ecosystem Champion)
[OK] Community Demand Working: Wishlist voting verified
[OK] Trust & Safety Reporting Working: Report submitted & moderation queue actioned
ALL STAGE 1 & FULL UPGRADE BACKEND TESTS PASSED!
```

---

## 🎯 Main Demo Journey for Judges

1. **Discover & Map View**: Browse the 16 seeded events. Click **"Map View"** to inspect the interactive Bengaluru tech cluster map (Koramangala, Indiranagar, Whitefield, etc.).
2. **Inspect Trust Intelligence**: Click on the trust badge on any card to view the **"Why this score?"** audit.
3. **Attendee Registration & Ticket Pass**: Click **"Register"** on any event. Fill out the 3-step attendee form with t-shirt size and diet, confirm, and receive your digital ticket pass with unique code (`ES-...`).
4. **Opportunity Radar**: Navigate to the **Radar** tab. Review personalized AI matches based on your goals and technical skills with explainable 4-factor scores.
5. **Smart Planner & Mobility Conflicts**: Switch to the **Planner** tab. Observe both time overlap warnings and hyperlocal physical transit conflict warnings.
6. **TeamMatch 2.0 & Squads**: Switch to **TeamMatch 2.0**. Review recommendations, switch to **Active Squads** to assemble a team, and check **Invitations**.
7. **Growth Passport**: Navigate to **Passport** to inspect your developer XP bar, Tier title (*Ecosystem Champion*), verified skill cloud, and dynamic badges.
8. **Community Wishlist**: Switch to **Wishlist** to upvote requested local events or submit a new community suggestion.
9. **Organizer Hub & Moderation Queue**: Switch to **Host & Admin**. View real-time platform statistics, publish a new verified event, and open the **Admin Moderation Queue** to review or unpublish reported listings.
10. **Reset Seeds**: Click **"Reset Seeds"** in the top navigation bar at any point to restore the clean initial demonstration dataset.
