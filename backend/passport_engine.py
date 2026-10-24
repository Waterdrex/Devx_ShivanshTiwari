from typing import Dict, Any, List

def compute_growth_passport(user: Dict[str, Any], user_registrations: List[Dict[str, Any]], user_teams: List[Dict[str, Any]]) -> Dict[str, Any]:
    active_regs = [r for r in user_registrations if r.get("status") != "cancelled"]
    
    # Calculate XP
    events_count = len(active_regs)
    teams_count = len(user_teams)
    hackathons_won = user.get("hackathons_won", 0)
    
    xp = (events_count * 120) + (teams_count * 150) + (hackathons_won * 250) + 100 # base onboarding XP
    
    if xp >= 1000:
        tier_title = "Ecosystem Champion"
        tier_level = 4
        next_tier_xp = 2000
    elif xp >= 600:
        tier_title = "Squad Architect"
        tier_level = 3
        next_tier_xp = 1000
    elif xp >= 300:
        tier_title = "Active Builder"
        tier_level = 2
        next_tier_xp = 600
    else:
        tier_title = "Tech Explorer"
        tier_level = 1
        next_tier_xp = 300

    # Skills Aggregation
    skill_counts = {}
    for r in active_regs:
        ev_skills = r.get("skills", [])
        if isinstance(ev_skills, list):
            for sk in ev_skills:
                skill_counts[sk] = skill_counts.get(sk, 0) + 1

    # Add user's stated skills
    for sk in user.get("skills", []):
        skill_counts[sk] = skill_counts.get(sk, 0) + 1

    ranked_skills = sorted(
        [{"skill": k, "endorsements": v} for k, v in skill_counts.items()],
        key=lambda x: x["endorsements"],
        reverse=True
    )

    # Badges Calculation
    badges = []
    
    # 1. Onboarding Badge
    badges.append({
        "id": "b-welcome",
        "name": "Verified Identity",
        "category": "Membership",
        "icon": "ShieldCheck",
        "earned": True,
        "description": "Completed KYC developer onboarding profile."
    })

    # 2. First Event Badge
    has_event = events_count >= 1
    badges.append({
        "id": "b-first-event",
        "name": "First Footprint",
        "category": "Attendance",
        "icon": "CalendarCheck",
        "earned": has_event,
        "description": f"Registered for your inaugural local event ({events_count} total registered)."
    })

    # 3. AI Vanguard
    has_ai = any("ai" in str(r.get("skills", [])).lower() or "ai" in str(r.get("title", "")).lower() for r in active_regs)
    badges.append({
        "id": "b-ai-vanguard",
        "name": "AI Agent Vanguard",
        "category": "Specialization",
        "icon": "Sparkles",
        "earned": has_ai,
        "description": "Engaged with machine learning and autonomous agent workshops."
    })

    # 4. Team Player
    has_team = teams_count >= 1
    badges.append({
        "id": "b-squad",
        "name": "Squad Commander",
        "category": "Collaboration",
        "icon": "Users",
        "earned": has_team,
        "description": "Formed or accepted an invitation into a hackathon team."
    })

    # 5. Champion
    badges.append({
        "id": "b-champion",
        "name": "Podium Finisher",
        "category": "Excellence",
        "icon": "Award",
        "earned": hackathons_won > 0,
        "description": f"Secured top prize across {hackathons_won} hackathon competitions."
    })

    return {
        "user_id": user.get("id"),
        "user_name": user.get("name"),
        "tier_title": tier_title,
        "tier_level": tier_level,
        "xp": xp,
        "next_tier_xp": next_tier_xp,
        "progress_pct": min(100, int((xp / next_tier_xp) * 100)),
        "events_attended": events_count,
        "teams_joined": teams_count,
        "hackathons_won": hackathons_won,
        "skills_verified": ranked_skills[:8],
        "badges": badges,
        "active_registrations": active_regs
    }
