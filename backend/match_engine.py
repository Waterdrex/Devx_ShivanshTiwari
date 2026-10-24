from typing import List, Dict, Any, Set

ROLE_COMPLEMENTARITY = {
    "Frontend Developer": {
        "Backend Developer": 40,
        "AI/ML Engineer": 38,
        "Full Stack Developer": 34,
        "UI/UX Designer": 35,
        "Mobile Developer": 25,
        "DevOps / Cloud": 30,
        "Frontend Developer": 18,
    },
    "Backend Developer": {
        "Frontend Developer": 40,
        "UI/UX Designer": 36,
        "AI/ML Engineer": 38,
        "Mobile Developer": 34,
        "DevOps / Cloud": 28,
        "Full Stack Developer": 25,
        "Backend Developer": 18,
    },
    "AI/ML Engineer": {
        "Full Stack Developer": 40,
        "Frontend Developer": 38,
        "Backend Developer": 36,
        "UI/UX Designer": 32,
        "DevOps / Cloud": 34,
        "Mobile Developer": 28,
        "AI/ML Engineer": 22,
    },
    "UI/UX Designer": {
        "Full Stack Developer": 40,
        "Frontend Developer": 38,
        "Backend Developer": 35,
        "AI/ML Engineer": 32,
        "Mobile Developer": 35,
        "UI/UX Designer": 15,
        "DevOps / Cloud": 20,
    },
    "Full Stack Developer": {
        "AI/ML Engineer": 40,
        "UI/UX Designer": 38,
        "DevOps / Cloud": 32,
        "Frontend Developer": 28,
        "Backend Developer": 28,
        "Mobile Developer": 30,
        "Full Stack Developer": 24,
    },
    "Mobile Developer": {
        "Backend Developer": 40,
        "UI/UX Designer": 38,
        "AI/ML Engineer": 32,
        "Full Stack Developer": 34,
        "DevOps / Cloud": 26,
        "Frontend Developer": 22,
        "Mobile Developer": 18,
    },
    "DevOps / Cloud": {
        "Full Stack Developer": 40,
        "Backend Developer": 36,
        "Frontend Developer": 32,
        "AI/ML Engineer": 34,
        "UI/UX Designer": 24,
        "Mobile Developer": 26,
        "DevOps / Cloud": 15,
    }
}

HACKATHON_BENCHMARK_SKILLS = {
    "Frontend": ["React", "TypeScript", "Tailwind CSS", "Next.js", "Vue"],
    "Backend": ["Python", "FastAPI", "Node.js", "PostgreSQL", "MongoDB", "Express", "REST APIs"],
    "AI/ML": ["PyTorch", "TensorFlow", "Hugging Face", "LangChain", "OpenAI API", "Scikit-Learn"],
    "Design": ["Figma", "UI/UX", "Wireframing", "Design Systems"],
    "DevOps": ["Docker", "Kubernetes", "AWS", "CI/CD", "Git"]
}

def calculate_compatibility(
    user_role: str,
    user_skills: List[str],
    user_interests: List[str],
    user_experience: str,
    candidate: Dict[str, Any]
) -> Dict[str, Any]:
    # 1. Role Complementarity (Max 40)
    cand_role = candidate.get("role", "Developer")
    role_map = ROLE_COMPLEMENTARITY.get(user_role, {})
    role_score = role_map.get(cand_role, 25)

    # 2. Skill Synergies (Max 35)
    u_skills_set = {s.lower() for s in user_skills}
    c_skills_set = {s.lower() for s in candidate.get("skills", [])}
    
    # Skills candidate brings that user lacks
    new_skills = [s for s in candidate.get("skills", []) if s.lower() not in u_skills_set]
    overlap_skills = [s for s in candidate.get("skills", []) if s.lower() in u_skills_set]
    
    # Skill points: higher reward for bringing complementary tech stack
    skill_pts = min(35, len(new_skills) * 8 + (2 if overlap_skills else 0))

    # Calculate what a complete 4-person team still lacks
    combined_skills = u_skills_set.union(c_skills_set)
    missing_areas = []
    for domain, skills in HACKATHON_BENCHMARK_SKILLS.items():
        domain_covered = any(sk.lower() in combined_skills for sk in skills)
        if not domain_covered:
            missing_areas.append(domain)

    # 3. Interest & Domain Alignment (Max 20)
    u_interests = {i.lower() for i in user_interests}
    c_interests = {i.lower() for i in candidate.get("interests", [])}
    shared_interests_raw = u_interests.intersection(c_interests)
    shared_interests = [i for i in candidate.get("interests", []) if i.lower() in shared_interests_raw]

    if len(shared_interests) >= 3:
        interest_pts = 20
    elif len(shared_interests) == 2:
        interest_pts = 16
    elif len(shared_interests) == 1:
        interest_pts = 10
    else:
        interest_pts = 4

    # 4. Experience Synergy (Max 5)
    exp_pts = 5
    cand_exp = candidate.get("experience_level", "Intermediate")
    if user_experience == "Beginner" and cand_exp in ["Intermediate", "Advanced"]:
        exp_pts = 5
    elif user_experience == "Advanced" and cand_exp == "Beginner":
        exp_pts = 3

    total_score = min(98, max(45, role_score + skill_pts + interest_pts + exp_pts))

    # Formulate rational match explanation
    explanation_parts = []
    if new_skills:
        top_skills = new_skills[:3]
        explanation_parts.append(f"Adds crucial capability in {', '.join(top_skills)} to balance your stack.")
    if shared_interests:
        explanation_parts.append(f"Shares passion for {', '.join(shared_interests[:2])}.")
    if not explanation_parts:
        explanation_parts.append("Balanced hackathon profile with complementary problem-solving skills.")

    explanation = " ".join(explanation_parts)

    return {
        "candidate": candidate,
        "compatibility_pct": total_score,
        "role_score": role_score,
        "skills_brought": new_skills,
        "shared_skills": overlap_skills,
        "shared_interests": shared_interests,
        "missing_team_domains": missing_areas,
        "match_explanation": explanation
    }

def rank_teammates(
    user_role: str,
    user_skills: List[str],
    user_interests: List[str],
    user_experience: str,
    candidates: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    scored = []
    for c in candidates:
        res = calculate_compatibility(user_role, user_skills, user_interests, user_experience, c)
        scored.append(res)
    
    scored.sort(key=lambda x: x["compatibility_pct"], reverse=True)
    return scored
