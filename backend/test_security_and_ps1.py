import os
import sys
import json
import traceback
from urllib.parse import urlparse, parse_qs
from fastapi import HTTPException
from pydantic import ValidationError

import main
from models import (
    EventCreate, EventUpdate, RegisterRequest, CancelRegistrationRequest,
    UserLogin, UserSignup, ReportResolveRequest
)
from database import init_db, get_connection

class MockResponse:
    def __init__(self, status_code: int, data: dict):
        self.status_code = status_code
        self._data = data

    def json(self):
        return self._data

class DirectFastAPIClient:
    """Synchronous in-process test client for EventSphere FastAPI backend.
    Executes route handlers directly with full Pydantic validation and error mapping,
    avoiding Windows Python 3.13 anyio socket thread hangs."""

    def _extract_auth(self, headers: dict) -> str | None:
        if not headers:
            return None
        return headers.get("Authorization") or headers.get("authorization")

    def get(self, url: str, headers: dict = None) -> MockResponse:
        parsed = urlparse(url)
        path = parsed.path
        qs = parse_qs(parsed.query)
        auth = self._extract_auth(headers)

        try:
            if path == "/api/health":
                return MockResponse(200, main.health_check())

            elif path == "/api/cities":
                return MockResponse(200, main.list_cities())

            elif path == "/api/events":
                city = qs.get("city", [None])[0]
                category = qs.get("category", [None])[0]
                locality = qs.get("locality", [None])[0]
                sort_by = qs.get("sort_by", ["relevance"])[0]
                lat = float(qs["latitude"][0]) if "latitude" in qs else None
                lon = float(qs["longitude"][0]) if "longitude" in qs else None
                rad = float(qs["radius_km"][0]) if "radius_km" in qs else None

                res = main.list_events(
                    city=city, category=category, locality=locality,
                    sort_by=sort_by, latitude=lat, longitude=lon, radius_km=rad,
                    authorization=auth
                )
                return MockResponse(200, res)

            elif path == "/api/admin/reports":
                status_filter = qs.get("status_filter", [None])[0]
                res = main.list_reports(status_filter=status_filter, authorization=auth)
                return MockResponse(200, res)

            elif path == "/api/admin/audit-logs":
                res = main.get_audit_logs(authorization=auth)
                return MockResponse(200, res)

            elif path == "/api/my-registrations":
                res = main.get_my_registrations(authorization=auth)
                return MockResponse(200, res)

            elif path == "/api/opportunity-radar":
                res = main.get_opportunity_radar(authorization=auth)
                return MockResponse(200, res)

            elif path == "/api/organizer/stats":
                res = main.get_organizer_stats(authorization=auth)
                return MockResponse(200, res)

            elif path == "/api/community-gaps":
                res = main.get_community_gaps()
                return MockResponse(200, res)

            else:
                return MockResponse(404, {"detail": f"Path {path} not found in test client"})

        except HTTPException as e:
            return MockResponse(e.status_code, {"detail": e.detail})
        except ValidationError as e:
            return MockResponse(422, {"detail": e.errors()})
        except Exception as e:
            return MockResponse(500, {"detail": str(e)})

    def post(self, url: str, json: dict = None, headers: dict = None) -> MockResponse:
        parsed = urlparse(url)
        path = parsed.path
        payload = json or {}
        auth = self._extract_auth(headers)

        try:
            if path == "/api/auth/login":
                req = UserLogin(**payload)
                res = main.login(req)
                return MockResponse(200, res)

            elif path == "/api/auth/signup":
                req = UserSignup(**payload)
                res = main.signup(req)
                return MockResponse(200, res)

            elif path == "/api/admin/reset":
                res = main.reset_demo_database(authorization=auth)
                return MockResponse(200, res)

            elif path.startswith("/api/admin/reports/") and path.endswith("/resolve"):
                parts = path.strip("/").split("/")
                report_id = parts[3]
                req = ReportResolveRequest(**payload)
                res = main.resolve_report(report_id, req, authorization=auth)
                return MockResponse(200, res)

            elif path == "/api/events":
                req = EventCreate(**payload)
                res = main.create_event(req, authorization=auth)
                return MockResponse(201, res)

            elif path.startswith("/api/events/") and path.endswith("/register"):
                parts = path.strip("/").split("/")
                event_id = parts[2]
                req = RegisterRequest(**payload)
                res = main.register_for_event(event_id, req, authorization=auth)
                return MockResponse(200, res)

            elif path.startswith("/api/registrations/") and path.endswith("/cancel"):
                parts = path.strip("/").split("/")
                reg_id = parts[2]
                req = CancelRegistrationRequest(**payload)
                res = main.cancel_registration(reg_id, req, authorization=auth)
                return MockResponse(200, res)

            else:
                return MockResponse(404, {"detail": f"Path {path} not found in test client"})

        except HTTPException as e:
            return MockResponse(e.status_code, {"detail": e.detail})
        except ValidationError as e:
            return MockResponse(422, {"detail": e.errors()})
        except Exception as e:
            return MockResponse(500, {"detail": str(e)})

    def put(self, url: str, json: dict = None, headers: dict = None) -> MockResponse:
        parsed = urlparse(url)
        path = parsed.path
        payload = json or {}
        auth = self._extract_auth(headers)

        try:
            if path.startswith("/api/events/"):
                parts = path.strip("/").split("/")
                event_id = parts[2]
                req = EventUpdate(**payload)
                res = main.update_event(event_id, req, authorization=auth)
                return MockResponse(200, res)
            else:
                return MockResponse(404, {"detail": f"Path {path} not found in test client"})
        except HTTPException as e:
            return MockResponse(e.status_code, {"detail": e.detail})
        except ValidationError as e:
            return MockResponse(422, {"detail": e.errors()})
        except Exception as e:
            return MockResponse(500, {"detail": str(e)})

    def delete(self, url: str, headers: dict = None) -> MockResponse:
        parsed = urlparse(url)
        path = parsed.path
        auth = self._extract_auth(headers)

        try:
            if path.startswith("/api/events/"):
                parts = path.strip("/").split("/")
                event_id = parts[2]
                res = main.delete_event(event_id, authorization=auth)
                return MockResponse(200, res)
            else:
                return MockResponse(404, {"detail": f"Path {path} not found in test client"})
        except HTTPException as e:
            return MockResponse(e.status_code, {"detail": e.detail})
        except ValidationError as e:
            return MockResponse(422, {"detail": e.errors()})
        except Exception as e:
            return MockResponse(500, {"detail": str(e)})

client = DirectFastAPIClient()

def setup_module():
    """Ensure database is freshly seeded for regression testing."""
    init_db(force_reset=True)

def test_unauthenticated_admin_rejected():
    """1. Unauthenticated administrative requests must be rejected with 401."""
    # Attempt DB reset with no auth token
    res = client.post("/api/admin/reset")
    assert res.status_code == 401, f"Expected 401 for unauthenticated reset, got {res.status_code}"

    # Attempt to view admin reports with no auth token
    res_reports = client.get("/api/admin/reports")
    assert res_reports.status_code == 401, f"Expected 401 for unauthenticated reports access, got {res_reports.status_code}"

    # Attempt to view audit logs with no auth token
    res_audit = client.get("/api/admin/audit-logs")
    assert res_audit.status_code == 401, f"Expected 401 for unauthenticated audit log access, got {res_audit.status_code}"

def test_ordinary_user_cannot_access_admin():
    """2. Ordinary users (attendees) cannot access administrative functions (403 Forbidden)."""
    # Log in as Aarav (standard attendee, non-admin)
    login_res = client.post("/api/auth/login", json={"email": "aarav.sharma@demo.eventsphere.io", "password": "password123"})
    assert login_res.status_code == 200
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt DB reset
    res = client.post("/api/admin/reset", headers=headers)
    assert res.status_code == 403, f"Expected 403 Forbidden for non-admin reset, got {res.status_code}"

    # Attempt to view admin reports
    res_rep = client.get("/api/admin/reports", headers=headers)
    assert res_rep.status_code == 403, f"Expected 403 Forbidden for non-admin reports list, got {res_rep.status_code}"

    # Attempt to resolve a report
    res_res = client.post("/api/admin/reports/rep-1/resolve", json={"action": "dismiss"}, headers=headers)
    assert res_res.status_code == 403, f"Expected 403 Forbidden for non-admin report resolution, got {res_res.status_code}"

def test_users_cannot_edit_or_delete_others_events():
    """3. Users cannot edit or delete another organizer's events."""
    # User A creates an event
    login_a = client.post("/api/auth/login", json={"email": "aarav.sharma@demo.eventsphere.io", "password": "password123"})
    token_a = login_a.json()["token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    create_res = client.post("/api/events", json={
        "title": "Aarav's Private AI Hackathon",
        "description": "An exclusive developer sprint for multi-agent workflows.",
        "category": "hackathons",
        "event_type": "hackathon",
        "format": "offline",
        "price_type": "free",
        "price": 0.0,
        "date": "2026-12-10",
        "start_time": "10:00",
        "end_time": "18:00",
        "venue": "WeWork Galaxy",
        "city": "Bengaluru",
        "location": "Bengaluru, Karnataka",
        "locality": "Indiranagar",
        "total_seats": 50,
        "skills": ["Python", "FastAPI"]
    }, headers=headers_a)
    assert create_res.status_code == 201
    event_id = create_res.json()["event"]["id"]

    # User B logs in
    login_b = client.post("/api/auth/login", json={"email": "priya.nair@demo.eventsphere.io", "password": "password123"})
    token_b = login_b.json()["token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B attempts to edit User A's event -> 403 Forbidden
    edit_res = client.put(f"/api/events/{event_id}", json={
        "title": "Hacked Title by Unauthorized User"
    }, headers=headers_b)
    assert edit_res.status_code == 403, f"Expected 403 Forbidden, got {edit_res.status_code}"

    # User B attempts to delete User A's event -> 403 Forbidden
    del_res = client.delete(f"/api/events/{event_id}", headers=headers_b)
    assert del_res.status_code == 403, f"Expected 403 Forbidden, got {del_res.status_code}"

    # User A (owner) can edit own event -> 200 OK
    edit_res_a = client.put(f"/api/events/{event_id}", json={
        "title": "Aarav's Updated AI Hackathon"
    }, headers=headers_a)
    assert edit_res_a.status_code == 200
    assert edit_res_a.json()["event"]["title"] == "Aarav's Updated AI Hackathon"

    # Clean up: User A can delete own event
    del_res_a = client.delete(f"/api/events/{event_id}", headers=headers_a)
    assert del_res_a.status_code == 200

def test_users_cannot_access_or_cancel_others_registrations():
    """4. Users cannot access or cancel another user's registrations."""
    # User A registers for ev-3
    login_a = client.post("/api/auth/login", json={"email": "aarav.sharma@demo.eventsphere.io", "password": "password123"})
    token_a = login_a.json()["token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    reg_res = client.post("/api/events/ev-3/register", json={
        "attendee_name": "Aarav Sharma",
        "attendee_email": "aarav.sharma@demo.eventsphere.io",
        "phone": "+91 99999 11111"
    }, headers=headers_a)
    assert reg_res.status_code == 200

    # Get User A's registration ID
    my_regs_a = client.get("/api/my-registrations", headers=headers_a).json()
    reg_record = next(r for r in my_regs_a["registrations"] if r["event_id"] == "ev-3")
    reg_id = reg_record["id"]

    # User B logs in
    login_b = client.post("/api/auth/login", json={"email": "priya.nair@demo.eventsphere.io", "password": "password123"})
    token_b = login_b.json()["token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B must NOT see User A's passes in My Registrations
    my_regs_b = client.get("/api/my-registrations", headers=headers_b).json()
    assert not any(r["id"] == reg_id for r in my_regs_b["registrations"]), "User B can see User A's pass!"

    # User B attempts to cancel User A's registration -> 403 Forbidden
    cancel_attempt = client.post(f"/api/registrations/{reg_id}/cancel", json={
        "cancellation_reason": "Malicious cancellation attempt"
    }, headers=headers_b)
    assert cancel_attempt.status_code == 403, f"Expected 403, got {cancel_attempt.status_code}"

    # User A cancels own registration -> 200 OK
    cancel_success = client.post(f"/api/registrations/{reg_id}/cancel", json={
        "cancellation_reason": "Legitimate cancellation by attendee"
    }, headers=headers_a)
    assert cancel_success.status_code == 200
    assert cancel_success.json()["status"] == "cancelled"

def test_invalid_input_rejected_safely():
    """5. Invalid input (negative price, 0 seats, unsafe URLs, bad dates) is rejected safely."""
    login_a = client.post("/api/auth/login", json={"email": "aarav.sharma@demo.eventsphere.io", "password": "password123"})
    token_a = login_a.json()["token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    base_payload = {
        "title": "Validation Test Event",
        "description": "Testing Pydantic input rejection constraints.",
        "category": "hackathons",
        "event_type": "hackathon",
        "format": "offline",
        "price_type": "paid",
        "price": 10.0,
        "date": "2026-11-20",
        "start_time": "10:00",
        "end_time": "18:00",
        "venue": "Test Venue",
        "city": "Bengaluru",
        "location": "Bengaluru, Karnataka",
        "total_seats": 50
    }

    # 5a. Negative price
    bad_price = dict(base_payload, price=-25.0)
    res = client.post("/api/events", json=bad_price, headers=headers_a)
    assert res.status_code == 422, f"Expected 422 for negative price, got {res.status_code}"

    # 5b. Zero total seats
    bad_seats = dict(base_payload, total_seats=0)
    res = client.post("/api/events", json=bad_seats, headers=headers_a)
    assert res.status_code == 422, f"Expected 422 for 0 seats, got {res.status_code}"

    # 5c. Dangerous javascript: URL scheme in source_url
    bad_url = dict(base_payload, source_url="javascript:alert(1)")
    res = client.post("/api/events", json=bad_url, headers=headers_a)
    assert res.status_code == 422, f"Expected 422 for dangerous URL, got {res.status_code}"

    # 5d. Malformed date
    bad_date = dict(base_payload, date="20-11-2026")
    res = client.post("/api/events", json=bad_date, headers=headers_a)
    assert res.status_code == 422, f"Expected 422 for malformed date, got {res.status_code}"

def test_capacity_limits_prevent_over_registration():
    """6. Capacity limits prevent over-registration atomically."""
    # Create event with capacity = 1
    login_admin = client.post("/api/auth/login", json={"email": "admin@demo.eventsphere.io", "password": "password123"})
    token_admin = login_admin.json()["token"]
    headers_admin = {"Authorization": f"Bearer {token_admin}"}

    create_res = client.post("/api/events", json={
        "title": "Ultra Exclusive 1-Seat Summit",
        "description": "Strict single seat roundtable testing atomic capacity checks.",
        "category": "tech_meetups",
        "event_type": "meetup",
        "format": "offline",
        "price_type": "free",
        "price": 0.0,
        "date": "2026-12-15",
        "start_time": "14:00",
        "end_time": "16:00",
        "venue": "Skyline Boardroom",
        "city": "Bengaluru",
        "location": "Bengaluru, Karnataka",
        "total_seats": 1
    }, headers=headers_admin)
    assert create_res.status_code == 201
    event_id = create_res.json()["event"]["id"]

    # User 1 registers -> succeeds
    login_1 = client.post("/api/auth/login", json={"email": "aarav.sharma@demo.eventsphere.io", "password": "password123"})
    headers_1 = {"Authorization": f"Bearer {login_1.json()['token']}"}
    res_1 = client.post(f"/api/events/{event_id}/register", json={
        "attendee_name": "Aarav Sharma",
        "attendee_email": "aarav.sharma@demo.eventsphere.io"
    }, headers=headers_1)
    assert res_1.status_code == 200
    assert res_1.json()["registered"] is True

    # User 2 attempts to register for the full event -> 400 Bad Request
    login_2 = client.post("/api/auth/login", json={"email": "priya.nair@demo.eventsphere.io", "password": "password123"})
    headers_2 = {"Authorization": f"Bearer {login_2.json()['token']}"}
    res_2 = client.post(f"/api/events/{event_id}/register", json={
        "attendee_name": "Priya Nair",
        "attendee_email": "priya.nair@demo.eventsphere.io"
    }, headers=headers_2)
    assert res_2.status_code == 400
    assert "maximum capacity" in res_2.json()["detail"].lower()

def test_duplicate_registrations_prevented():
    """7. Duplicate registrations are prevented for the same user."""
    login_1 = client.post("/api/auth/login", json={"email": "aarav.sharma@demo.eventsphere.io", "password": "password123"})
    headers_1 = {"Authorization": f"Bearer {login_1.json()['token']}"}

    # Register for ev-5
    res1 = client.post("/api/events/ev-5/register", json={
        "attendee_name": "Aarav Sharma",
        "attendee_email": "aarav.sharma@demo.eventsphere.io"
    }, headers=headers_1)
    assert res1.status_code == 200

    # Repeat registration request
    res2 = client.post("/api/events/ev-5/register", json={
        "attendee_name": "Aarav Sharma",
        "attendee_email": "aarav.sharma@demo.eventsphere.io"
    }, headers=headers_1)
    assert res2.status_code == 200
    # Must indicate already registered and return existing ticket without duplicating count
    assert res2.json().get("already_registered") is True

def test_authorized_organizer_and_attendee_workflows():
    """8. Authorized organizer and attendee workflows continue to work."""
    # Attendee discovery & distance filter
    disc = client.get("/api/events?city=Bengaluru&sort_by=relevance")
    assert disc.status_code == 200
    assert disc.json()["count"] >= 10

    # Opportunity Radar recommendations
    login_1 = client.post("/api/auth/login", json={"email": "aarav.sharma@demo.eventsphere.io", "password": "password123"})
    token_1 = login_1.json()["token"]
    headers_1 = {"Authorization": f"Bearer {token_1}"}

    radar = client.get("/api/opportunity-radar", headers=headers_1)
    assert radar.status_code == 200
    assert len(radar.json()["recommendations"]) >= 1

    # Organizer Hub metrics:
    # 1. Platform administrator sees aggregate events
    login_admin = client.post("/api/auth/login", json={"email": "admin@demo.eventsphere.io", "password": "password123"})
    org_stats_admin = client.get("/api/organizer/stats", headers={"Authorization": f"Bearer {login_admin.json()['token']}"})
    assert org_stats_admin.status_code == 200
    assert org_stats_admin.json()["total_events"] >= 15

    # 2. Registered event organizer sees their scoped events
    login_org = client.post("/api/auth/login", json={"email": "organizer@demo.eventsphere.io", "password": "password123"})
    org_stats_org = client.get("/api/organizer/stats", headers={"Authorization": f"Bearer {login_org.json()['token']}"})
    assert org_stats_org.status_code == 200
    assert "total_events" in org_stats_org.json()

def test_legitimate_administrator_workflow():
    """9. The legitimate administrator workflow continues to work."""
    # Log in as platform administrator
    login_admin = client.post("/api/auth/login", json={"email": "admin@demo.eventsphere.io", "password": "password123"})
    assert login_admin.status_code == 200
    admin_token = login_admin.json()["token"]
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # Admin reviews moderation queue
    rep_res = client.get("/api/admin/reports?status_filter=pending", headers=headers_admin)
    assert rep_res.status_code == 200
    reports = rep_res.json()["reports"]

    if reports:
        target_rep = reports[0]["id"]
        resolve_res = client.post(f"/api/admin/reports/{target_rep}/resolve", json={"action": "dismiss"}, headers=headers_admin)
        assert resolve_res.status_code == 200

    # Admin inspects audit trail
    audit_res = client.get("/api/admin/audit-logs", headers=headers_admin)
    assert audit_res.status_code == 200
    assert "audit_logs" in audit_res.json()

def test_development_only_features_remain_disabled_under_production():
    """10. Development-only features (e.g. database reset) remain disabled under production configuration."""
    login_admin = client.post("/api/auth/login", json={"email": "admin@demo.eventsphere.io", "password": "password123"})
    assert login_admin.status_code == 200
    headers_admin = {"Authorization": f"Bearer {login_admin.json()['token']}"}

    # Temporarily set environment to production with reset disabled
    orig_env = os.environ.get("ENVIRONMENT", "development")
    orig_reset = os.environ.get("ALLOW_DEMO_RESET", "true")

    try:
        os.environ["ENVIRONMENT"] = "production"
        os.environ["ALLOW_DEMO_RESET"] = "false"

        # Even with valid admin credentials, production lock must block reset
        reset_res = client.post("/api/admin/reset", headers=headers_admin)
        assert reset_res.status_code == 403, f"Expected 403 in production, got {reset_res.status_code}"
        assert "disabled in production" in reset_res.json()["detail"].lower()
    finally:
        os.environ["ENVIRONMENT"] = orig_env
        os.environ["ALLOW_DEMO_RESET"] = orig_reset

def test_configurable_cities_and_distance_filtering():
    """11. Configurable cities and coordinate-based distance filtering."""
    # List supported cities
    cities_res = client.get("/api/cities")
    assert cities_res.status_code == 200
    cities = [c["name"] for c in cities_res.json()["cities"]]
    assert "Bengaluru" in cities
    assert "Mumbai" in cities

    # Filter by user GPS coords with radius = 5 km
    # Koramangala coords: 12.9352, 77.6245
    nearby_res = client.get("/api/events?latitude=12.9352&longitude=77.6245&radius_km=5.0")
    assert nearby_res.status_code == 200
    events = nearby_res.json()["events"]
    # All returned non-online events must be within 5.0 km
    for ev in events:
        if ev.get("distance_km") is not None and ev.get("format") != "online":
            assert ev["distance_km"] <= 5.0, f"Event {ev['title']} is {ev['distance_km']} km away (exceeds 5.0 km radius)!"

def test_community_gap_radar():
    """12. Community Gap Radar calculates supply vs demand."""
    res = client.get("/api/community-gaps")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] >= 1
    assert "gaps" in data
    first_gap = data["gaps"][0]
    assert "locality" in first_gap
    assert "gap_score" in first_gap
    assert "suggested_topic" in first_gap
    assert first_gap["is_demo_insight"] is True

if __name__ == "__main__":
    setup_module()
    test_funcs = [
        test_unauthenticated_admin_rejected,
        test_ordinary_user_cannot_access_admin,
        test_users_cannot_edit_or_delete_others_events,
        test_users_cannot_access_or_cancel_others_registrations,
        test_invalid_input_rejected_safely,
        test_capacity_limits_prevent_over_registration,
        test_duplicate_registrations_prevented,
        test_authorized_organizer_and_attendee_workflows,
        test_legitimate_administrator_workflow,
        test_development_only_features_remain_disabled_under_production,
        test_configurable_cities_and_distance_filtering,
        test_community_gap_radar
    ]
    print(f"Running {len(test_funcs)} security & PS1 regression tests...")
    passed = 0
    failed = 0
    for fn in test_funcs:
        fn_name = fn.__name__
        print(f"--> Running {fn_name}...", flush=True)
        try:
            fn()
            print(f"  [PASS] {fn_name}", flush=True)
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {fn_name}: {e}", flush=True)
            traceback.print_exc()
            failed += 1

    print(f"\n==========================================")
    print(f"Summary: {passed} passed, {failed} failed out of {len(test_funcs)} tests.")
    print(f"==========================================")
    if failed > 0:
        sys.exit(1)
    else:
        print("ALL 12 SECURITY & PS1 REGRESSION TESTS PASSED!")
