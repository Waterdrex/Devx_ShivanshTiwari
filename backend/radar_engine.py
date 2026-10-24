from typing import Dict, Any, List, Optional

GOAL_CATEGORY_MAP = {
    "Win Hackathons": ["hackathons", "coding_contests"],
    "Find Teammates": ["hackathons", "workshops", "tech_meetups"],
    "AI/Agents Upskilling": ["workshops", "hackathons"],
    "Tech Networking": ["tech_meetups", "volunteering"],
    "Open Source & Community": ["volunteering", "tech_meetups"],
    "Land Tech Jobs": ["hackathons", "tech_meetups", "coding_contests"]
}

def compute_radar_score(
    event: Dict[str, Any],
    user_goals: List[str],
    user_skills: List[str],
    user_interests: List[str],
    max_budget: Optional[float] = None,
    user_planned_dates: Optional[List[str]] = None,
    user_locality: Optional[str] = None
) -> Dict[str, Any]:
    # 1. Goal Alignment (Max 35)
    goal_score = 0
    ev_cat = event.get("category", "")
    ev_type = event.get("event_type", "")
    
    matched_goals = []
    for g in user_goals:
        matching_cats = GOAL_CATEGORY_MAP.get(g, [])
        if ev_cat in matching_cats or ev_type in matching_cats:
            matched_goals.append(g)
            goal_score = max(goal_score, 35 if len(matched_goals) >= 2 else 28)

    if not goal_score:
        goal_score = 15 # default baseline

    # 2. Skill Synergy (Max 30)
    u_skills = {s.lower() for s in user_skills}
    ev_skills = {s.lower() for s in event.get("skills", [])}
    
    skill_overlap = [s for s in event.get("skills", []) if s.lower() in u_skills]
    skill_growth = [s for s in event.get("skills", []) if s.lower() not in u_skills]
    
    if len(skill_overlap) >= 2:
        skill_score = 30
    elif len(skill_overlap) == 1:
        skill_score = 24
    elif skill_growth:
        skill_score = 16 # offers learning opportunity
    else:
        skill_score = 10

    # 3. Interest Fit (Max 20)
    u_interests = {i.lower() for i in user_interests}
    ev_text = (event.get("title", "") + " " + event.get("description", "") + " " + " ".join(event.get("skills", []))).lower()
    
    matched_interests = [i for i in user_interests if i.lower() in ev_text]
    if len(matched_interests) >= 2:
        interest_score = 20
    elif len(matched_interests) == 1:
        interest_score = 14
    else:
        interest_score = 6

    # 4. Budget & Schedule Friction (Max 15)
    budget_ok = True
    if max_budget is not None:
        budget_ok = float(event.get("price", 0.0)) <= float(max_budget)
    elif event.get("price_type") == "free":
        budget_ok = True

    budget_score = 8 if budget_ok else 0

    # Schedule fit
    ev_date = event.get("date", "")
    schedule_free = not user_planned_dates or (ev_date not in user_planned_dates)
    schedule_score = 7 if schedule_free else 2

    total = goal_score + skill_score + interest_score + budget_score + schedule_score
    radar_score = min(99, max(25, total))

    if not budget_ok:
        # Penalize overall score if exceeding explicit hard user budget
        radar_score = min(radar_score, 60)

    if radar_score >= 85:
        tier = "Exceptional Match"
        color = "emerald"
    elif radar_score >= 70:
        tier = "Strong Match"
        color = "teal"
    else:
        tier = "Moderate Fit"
        color = "slate"

    # Formulate rational explanation
    reasons = []
    if not budget_ok:
        reasons.append(f"Exceeds your ${max_budget} budget (shown as alternative)")
    if matched_goals:
        reasons.append(f"Accelerates your goal: '{matched_goals[0]}'")
    if skill_overlap:
        reasons.append(f"Direct match for your {', '.join(skill_overlap[:2])} skills")
    elif skill_growth:
        reasons.append(f"Expands your stack into {skill_growth[0]}")
    if event.get("locality") and user_locality and event.get("locality").lower() == user_locality.lower():
        reasons.append(f"Happening right in {user_locality}")
    elif event.get("price_type") == "free":
        reasons.append("Free entry pass")

    explanation = " • ".join(reasons) if reasons else "Good general alignment with your developer profile."

    return {
        "radar_score": radar_score,
        "tier": tier,
        "badge_color": color,
        "goal_score": goal_score,
        "skill_score": skill_score,
        "interest_score": interest_score,
        "practicality_score": budget_score + schedule_score,
        "matched_goals": matched_goals,
        "skill_overlap": skill_overlap,
        "explanation": explanation
    }
