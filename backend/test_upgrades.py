import sys
import os
import json

def test_upgrades():
    print("=== TESTING EVENTSPHERE STAGE 1 & FULL UPGRADES ===")
    import main
    from models import (
        UserSignup, UserLogin, RegisterRequest, CancelRegistrationRequest,
        RadarQueryRequest, TeamCreateRequest, TeamInviteRequest, InviteRespondRequest,
        ReportCreateRequest, ReportResolveRequest, DemandCreateRequest
    )

    # 1. Test Auth: Login with seeded user
    login_res = main.login(UserLogin(email="aarav.sharma@demo.eventsphere.io", password="password123"))
    assert "token" in login_res, "Failed to login"
    token = login_res["token"]
    user = login_res["user"]
    print(f"[OK] Auth Login Working: User '{user['name']}' logged in, token: {token[:12]}...")

    # 1b. Test Auth: Signup new user
    test_email = "test.builder@demo.eventsphere.io"
    # Remove if exists from earlier run
    conn = main.get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM users WHERE email = ?", (test_email,))
    conn.commit()
    conn.close()

    signup_res = main.signup(UserSignup(
        name="Kiran Rao",
        email=test_email,
        password="securePassword456!",
        role="AI/ML Engineer",
        locality="Indiranagar"
    ))
    assert signup_res["token"], "Failed to signup"
    print(f"[OK] Auth Signup Working: User '{signup_res['user']['name']}' created with ID: {signup_res['user']['id']}")

    # 2. Test Proper Event Registration with Attendee Details & Ticket Generation
    reg_req = RegisterRequest(
        user_id="u-1",
        attendee_name="Aarav Sharma",
        attendee_email="aarav.sharma@demo.eventsphere.io",
        phone="+91 98765 00000",
        tshirt_size="L",
        dietary="Vegetarian",
        github_linkedin="github.com/aaravsharma"
    )
    reg_res = main.register_for_event("ev-2", reg_req, authorization=f"Bearer {token}")
    assert reg_res["registered"] or reg_res.get("already_registered"), "Registration failed"
    print(f"[OK] Event Registration Working: {reg_res['message']}")

    # 2b. Test My Registrations Dashboard API
    my_regs = main.get_my_registrations(authorization=f"Bearer {token}")
    assert my_regs["count"] >= 1, "Expected at least 1 registration"
    first_reg = my_regs["registrations"][0]
    print(f"[OK] My Events Dashboard Working: Found {my_regs['count']} registered passes. Ticket: {first_reg.get('ticket_code')} ({first_reg.get('status')})")

    # 3. Test Opportunity Radar
    radar_res = main.get_opportunity_radar(authorization=f"Bearer {token}", user_id="u-1")
    assert radar_res["count"] >= 1, "Opportunity radar returned 0 matches"
    top_radar = radar_res["recommendations"][0]
    print(f"[OK] Opportunity Radar Working: Top recommendation '{top_radar['title']}' with Radar Score: {top_radar['radar']['radar_score']}/100")
    print(f"  -> Explanation: '{top_radar['radar']['explanation']}'")

    # 4. Test Hyperlocal Discovery Localities & Travel Conflicts
    localities = main.list_localities()
    assert len(localities["localities"]) >= 5, "Expected Bengaluru localities"
    print(f"[OK] Hyperlocal Discovery Working: {len(localities['localities'])} active clusters mapped")

    # 5. Test TeamMatch 2.0 (Team Creation & Invites)
    team_res = main.create_team(
        TeamCreateRequest(
            event_id="ev-1",
            name="Quantum Pioneers",
            description="Autonomous quantum agent routing platform for FinTech.",
            required_roles=["Backend Developer", "AI/ML Engineer"]
        ),
        authorization=f"Bearer {token}",
        user_id="u-1"
    )
    team_id = team_res["team_id"]
    print(f"[OK] TeamMatch 2.0 Team Creation Working: Created team '{team_id}'")

    inv_res = main.invite_teammate(
        team_id=team_id,
        payload=TeamInviteRequest(to_user_id="u-3", role="AI/ML Engineer", message="Join our squad!"),
        authorization=f"Bearer {token}",
        user_id="u-1"
    )
    print(f"[OK] TeamMatch 2.0 Invitation Working: Invite ID '{inv_res['invitation_id']}'")

    # 6. Test Growth Passport
    passport = main.get_growth_passport(authorization=f"Bearer {token}", user_id="u-1")
    assert passport["xp"] > 0, "Expected non-zero XP in passport"
    print(f"[OK] Growth Passport Working: {passport['user_name']} has {passport['xp']} XP (Tier: {passport['tier_title']}) with {len(passport['badges'])} achievements")

    # 7. Test Community Demand (Wishlist & Voting)
    demands = main.list_community_demands(user_id="u-1")
    assert demands["count"] >= 1, "Expected community demands"
    first_dem = demands["demands"][0]
    print(f"[OK] Community Demand Working: Found '{first_dem['title']}' with {first_dem['votes_count']} votes")

    vote_res = main.vote_demand(first_dem["id"], authorization=f"Bearer {token}", user_id="u-1")
    print(f"[OK] Community Voting Working: {vote_res['message']} (Total votes: {vote_res['votes_count']})")

    # 8. Test Trust & Safety Report
    rep_res = main.report_event("ev-15", ReportCreateRequest(reason="duplicate", details="Suspicious mirror listing"), authorization=f"Bearer {token}", user_id="u-1")
    print(f"[OK] Trust & Safety Reporting Working: Report submitted ID '{rep_res['report_id']}'")

    # 8b. Test Admin Moderation Queue with Admin Credentials
    from fastapi import HTTPException
    # Ordinary user access must be rejected
    try:
        main.list_reports(status_filter="pending", authorization=f"Bearer {token}")
        assert False, "Ordinary user was able to access admin reports!"
    except HTTPException as e:
        assert e.status_code == 403, f"Expected 403, got {e.status_code}"
        print("[OK] RBAC Enforced: Non-admin user access to admin reports rejected with 403 Forbidden")

    # Authenticated Admin access succeeds
    admin_login = main.login(UserLogin(email="admin@demo.eventsphere.io", password="password123"))
    admin_token = f"Bearer {admin_login['token']}"
    admin_reports = main.list_reports(status_filter="pending", authorization=admin_token)
    assert admin_reports["count"] >= 1, "Expected report in admin queue"
    print(f"[OK] Admin Moderation Queue Working: {admin_reports['count']} pending reports in queue accessed by Admin")

    print("\nALL STAGE 1 & FULL UPGRADE BACKEND TESTS PASSED!")

if __name__ == "__main__":
    test_upgrades()
