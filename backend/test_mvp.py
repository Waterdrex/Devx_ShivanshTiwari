import sys
import os
import json

def test_full_flow():
    print("=== STARTING EVENTSPHERE MVP END-TO-END VALIDATION ===")
    
    # 1. Test database and seed initialization
    from database import get_connection, init_db, SEED_EVENTS, SEED_USERS
    init_db(force_reset=True)
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM events")
    event_count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM users")
    user_count = c.fetchone()[0]
    conn.close()
    print(f"[OK] Database Initialized: {event_count} events seeded (>=15 required), {user_count} demo users seeded (>=8 required)")
    assert event_count >= 15, f"Expected at least 15 events, found {event_count}"
    assert user_count >= 8, f"Expected at least 8 users, found {user_count}"

    # 2. Test Discovery & Filters
    import main
    events_res = main.list_events(search="HyperHack", category="all", price_type="all", format="all", sort_by="relevance", user_id="u-1")
    assert events_res["count"] >= 1, "Failed to discover 'HyperHack' event"
    hyperhack = events_res["events"][0]
    print(f"[OK] Event Discovery Working: Found '{hyperhack['title']}' with available seats: {hyperhack['available_seats']}")

    # 3. Test Trust Intelligence & Explainability
    trust = hyperhack["trust"]
    print(f"[OK] Trust Intelligence Working: Score = {trust['score']}/100, Tier = '{trust['tier']}', Signals Count = {len(trust['signals'])}")
    assert trust["score"] > 80, "Expected high trust score for verified HyperHack event"
    
    # Test Duplicate Detection on seeded clone event
    mirror_event = next((e for e in main.get_all_raw_events() if "Mirror" in e["title"]), None)
    assert mirror_event is not None, "Mirror event not found"
    dup_trust = main.compute_trust_score(mirror_event, main.detect_duplicate(mirror_event, main.get_all_raw_events()))
    print(f"[OK] Duplicate Detection Working: Mirror Event flagged = {dup_trust['is_duplicate_flagged']}, Score penalized to {dup_trust['score']}/100")
    assert dup_trust["is_duplicate_flagged"] is True, "Mirror event was not flagged as duplicate!"

    # 4. Test Smart Planner & Schedule Conflict Detection
    # ev-1 (HyperHack, 09:00 - 21:00 on 2026-11-14) and ev-2 (Agentic Masterclass, 10:00 - 14:00 on 2026-11-14)
    planner_data = main.get_user_schedule("u-1")
    print(f"[OK] Smart Planner Working: {planner_data['count']} events in itinerary, Conflicts detected = {planner_data['has_conflicts']}")
    assert planner_data["has_conflicts"] is True, "Conflict detection failed to detect overlapping events"
    assert len(planner_data["conflicts"]) >= 1, "Expected at least 1 conflict record"
    first_conflict = planner_data["conflicts"][0]
    print(f"  -> Conflict Detail: Overlap of {first_conflict['overlap_minutes']} mins on {first_conflict['date']} between '{first_conflict['event_a_title']}' & '{first_conflict['event_b_title']}'")
    assert len(planner_data["recommended_alternatives"]) >= 1, "Expected non-conflicting replacement recommendations"
    print(f"  -> Alternative Recommendation: '{planner_data['recommended_alternatives'][0]['title']}'")

    # 5. Test TeamMatch Recommendations
    from models import TeamMatchRequest
    match_req = TeamMatchRequest(
        user_role="Frontend Developer",
        user_skills=["React", "TypeScript", "Tailwind CSS"],
        experience_level="Intermediate",
        interests=["AI/ML", "HealthTech"]
    )
    match_res = main.recommend_teammates(match_req)
    matches = match_res["matches"]
    print(f"[OK] TeamMatch Algorithm Working: {len(matches)} candidates ranked")
    top_match = matches[0]
    print(f"  -> Top Teammate: {top_match['candidate']['name']} ({top_match['candidate']['role']}) with {top_match['compatibility_pct']}% compatibility")
    print(f"  -> Match Explanation: '{top_match['match_explanation']}'")
    print(f"  -> Skills Brought: {top_match['skills_brought']}")
    assert top_match["compatibility_pct"] >= 80, "Expected high compatibility percentage for complementary role"

    # 6. Test Organizer Dashboard & Event Creation
    from models import EventCreate
    new_event_data = EventCreate(
        title="Autonomous Edge Drone Hackathon 2026",
        description="Join leading autonomous robotics engineers to deploy vision edge models on real quadcopters.",
        category="hackathons",
        event_type="hackathon",
        format="offline",
        price_type="free",
        price=0.0,
        date="2026-12-05",
        start_time="09:00",
        end_time="19:00",
        venue="Aerospace Innovation Center",
        city="Bengaluru",
        location="Bengaluru, Karnataka",
        organizer_name="AeroRobotics Labs",
        organizer_email="hack@aerorobotics.org",
        organizer_verified=1,
        total_seats=80,
        skills=["Python", "PyTorch", "Robotics", "FastAPI"],
        agenda="09:00 Briefing, 11:00 Flight Labs, 17:00 Final Demos"
    )
    created = main.create_event(new_event_data)
    print(f"[OK] Organizer Event Publishing Working: Created '{created['event']['title']}' (ID: {created['event']['id']})")
    
    stats = main.get_organizer_stats()
    print(f"[OK] Organizer Hub Stats Working: Total events = {stats['total_events']}, Registrations = {stats['total_registrations']}, Avg Trust = {stats['average_trust_score']}")

    # 7. Test Registration & Bookmark
    from models import RegisterRequest, BookmarkToggleRequest
    reg_res = main.register_for_event(created['event']['id'], RegisterRequest(attendee_name="Priya Tester", attendee_email="priya@test.com"))
    print(f"[OK] Registration Working: {reg_res['message']}")
    
    bm_res = main.toggle_bookmark(BookmarkToggleRequest(user_id="u-1", event_id=created['event']['id']))
    print(f"[OK] Bookmarking Working: {bm_res['message']} (is_bookmarked: {bm_res['is_bookmarked']})")

    print("\nALL FULL-STACK MVP VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_flow()
