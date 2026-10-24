import sqlite3
import json
import os
import uuid
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "eventsphere.db")

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


SEED_USERS = [
    {
        "id": "u-admin",
        "name": "Ecosystem Admin",
        "role": "Platform Administrator",
        "experience_level": "Expert",
        "bio": "Platform moderation, community safety governance, and host verification oversight.",
        "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80",
        "skills": ["Trust & Safety", "Event Operations", "Moderation", "Governance"],
        "interests": ["Security", "Tech Ecosystems", "Open Source", "Hackathons"],
        "github": "github.com/eventsphere-admin",
        "email": "admin@demo.eventsphere.io",
        "hackathons_won": 5,
        "is_admin": 1
    },
    {
        "id": "u-organizer",
        "name": "Bangalore Tech Organizer",
        "role": "Event Organizer",
        "experience_level": "Advanced",
        "bio": "HyperLab Global Lead and Bangalore Tech Collective organizer hosting hackathons and technical masterclasses.",
        "avatar_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80",
        "skills": ["Event Hosting", "FastAPI", "Python", "Community Building"],
        "interests": ["Hackathons", "AI/ML", "Developer Ecosystems"],
        "github": "github.com/hyperlab-host",
        "email": "organizer@demo.eventsphere.io",
        "hackathons_won": 3,
        "is_admin": 0
    },
    {
        "id": "u-1",
        "name": "Aarav Sharma",
        "role": "Frontend Developer",
        "experience_level": "Intermediate",
        "bio": "Specialized in high-performance React & Next.js web applications with smooth micro-interactions.",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
        "skills": ["React", "TypeScript", "Tailwind CSS", "Next.js", "Redux"],
        "interests": ["AI/ML", "HealthTech", "FinTech", "Developer Tools"],
        "github": "github.com/aaravsharma",
        "email": "aarav.sharma@demo.eventsphere.io",
        "hackathons_won": 2,
        "is_admin": 0
    },
    {
        "id": "u-2",
        "name": "Priya Nair",
        "role": "Backend Developer",
        "experience_level": "Advanced",
        "bio": "Distributed systems engineer building resilient APIs with FastAPI, Go, and PostgreSQL.",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80",
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "REST APIs", "Redis"],
        "interests": ["AI/ML", "HealthTech", "FinTech", "Open Source"],
        "github": "github.com/priyanair-dev",
        "email": "priya.nair@demo.eventsphere.io",
        "hackathons_won": 4
    },
    {
        "id": "u-3",
        "name": "Devansh Patel",
        "role": "AI/ML Engineer",
        "experience_level": "Advanced",
        "bio": "LLM fine-tuning, RAG pipelines, and vision models with PyTorch and LangChain.",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
        "skills": ["Python", "PyTorch", "Hugging Face", "LangChain", "OpenAI API", "Vector DBs"],
        "interests": ["AI/ML", "HealthTech", "Robotics", "Web3"],
        "github": "github.com/devansh-ai",
        "email": "devansh.patel@demo.eventsphere.io",
        "hackathons_won": 3
    },
    {
        "id": "u-4",
        "name": "Ananya Roy",
        "role": "UI/UX Designer",
        "experience_level": "Intermediate",
        "bio": "Product designer crafting clean accessibility-first experiences, design systems, and clickable prototypes.",
        "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80",
        "skills": ["Figma", "UI/UX", "Wireframing", "Design Systems", "User Research", "Tailwind CSS"],
        "interests": ["FinTech", "HealthTech", "Social Impact", "EdTech"],
        "github": "github.com/ananyadesigns",
        "email": "ananya.roy@demo.eventsphere.io",
        "hackathons_won": 1
    },
    {
        "id": "u-5",
        "name": "Rohan Deshmukh",
        "role": "Full Stack Developer",
        "experience_level": "Advanced",
        "bio": "Full-stack hacker fast at MVP velocity. Node, React, and serverless architectures.",
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80",
        "skills": ["React", "Node.js", "Express", "TypeScript", "MongoDB", "Docker"],
        "interests": ["Web3", "Developer Tools", "Gaming", "FinTech"],
        "github": "github.com/rohandesh",
        "email": "rohan.desh@demo.eventsphere.io",
        "hackathons_won": 3
    },
    {
        "id": "u-6",
        "name": "Meera Joshi",
        "role": "Mobile Developer",
        "experience_level": "Intermediate",
        "bio": "Building fluid cross-platform mobile apps using Flutter and React Native.",
        "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80",
        "skills": ["Flutter", "React Native", "TypeScript", "Firebase", "Mobile UI"],
        "interests": ["HealthTech", "Social Impact", "IoT"],
        "github": "github.com/meerajoshi-m",
        "email": "meera.joshi@demo.eventsphere.io",
        "hackathons_won": 1
    },
    {
        "id": "u-7",
        "name": "Kabir Sen",
        "role": "DevOps / Cloud",
        "experience_level": "Advanced",
        "bio": "Infra automated on AWS, Kubernetes, Terraform with seamless GitHub Actions CI/CD.",
        "avatar_url": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=250&q=80",
        "skills": ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Linux"],
        "interests": ["Cloud Architecture", "Developer Tools", "Security", "AI/ML"],
        "github": "github.com/kabirsen-cloud",
        "email": "kabir.sen@demo.eventsphere.io",
        "hackathons_won": 2
    },
    {
        "id": "u-8",
        "name": "Tanvi Verma",
        "role": "AI/ML Engineer",
        "experience_level": "Beginner",
        "bio": "Computer science undergrad focusing on conversational agents, NLP, and prompt evaluation.",
        "avatar_url": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80",
        "skills": ["Python", "Scikit-Learn", "OpenAI API", "Pandas", "Streamlit"],
        "interests": ["AI/ML", "Social Impact", "EdTech"],
        "github": "github.com/tanviverma-code",
        "email": "tanvi.verma@demo.eventsphere.io",
        "hackathons_won": 0
    }
]

SEED_EVENTS = [
    {
        "id": "ev-1",
        "title": "HyperHack 2026: AI & Agents Global Hackathon",
        "description": "36-hour sprint building autonomous agents, multi-modal workflows, and edge intelligence. Mentorship from top AI labs with $25k prize pool and compute credits.",
        "category": "hackathons",
        "event_type": "hackathon",
        "format": "offline",
        "price_type": "free",
        "price": 0.0,
        "date": "2026-11-14",
        "start_time": "09:00",
        "end_time": "21:00",
        "venue": "Innovation Hub, Tech Park Phase 2",
        "city": "Bengaluru",
        "location": "Bengaluru, Karnataka",
        "banner_url": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
        "organizer_name": "HyperLab Global Foundation",
        "organizer_email": "hack@hyperlab.org",
        "organizer_verified": 1,
        "organizer_rating": 4.9,
        "total_seats": 250,
        "registered_seats": 194,
        "skills": ["Python", "PyTorch", "FastAPI", "React", "LangChain"],
        "agenda": "Day 1: 09:00 Check-in, 10:30 Keynote & Problem Statements, 13:00 Hacking Begins. Day 2: 15:00 Demos & Judging, 18:00 Awards.",
        "is_featured": 1
    },
    {
        "id": "ev-2",
        "title": "Agentic AI Architectures & RAG Masterclass",
        "description": "Deep-dive workshop on graph-based agent routing, hybrid dense retrieval, and production latency optimization. Interactive hands-on labs with cloud notebooks.",
        "category": "workshops",
        "event_type": "workshop",
        "format": "offline",
        "price_type": "paid",
        "price": 25.0,
        "date": "2026-11-14",
        "start_time": "10:00",
        "end_time": "14:00",
        "venue": "Campus Auditorium, 3rd Floor",
        "city": "Bengaluru",
        "location": "Bengaluru, Karnataka",
        "banner_url": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
        "organizer_name": "DevCircle Academy",
        "organizer_email": "workshops@devcircle.io",
        "organizer_verified": 1,
        "organizer_rating": 4.8,
        "total_seats": 60,
        "registered_seats": 52,
        "skills": ["Python", "LangChain", "Vector DBs", "OpenAI API"],
        "agenda": "10:00 Agent State Machines, 11:30 Advanced Vector Indexing, 13:00 Live Benchmarking.",
        "is_featured": 1
    },
    {
        "id": "ev-3",
        "title": "Cloud-Native Microservices Summit",
        "description": "Engineering leaders share zero-trust network policies, eBPF observability, and Kubernetes cost reduction strategies at multi-petabyte scale.",
        "category": "tech_meetups",
        "event_type": "meetup",
        "format": "offline",
        "price_type": "free",
        "price": 0.0,
        "date": "2026-11-14",
        "start_time": "14:00",
        "end_time": "18:00",
        "venue": "Apex Tower Conference Center",
        "city": "Bengaluru",
        "location": "Bengaluru, Karnataka",
        "banner_url": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
        "organizer_name": "Cloud Native Community Group",
        "organizer_email": "contact@cncf-local.org",
        "organizer_verified": 1,
        "organizer_rating": 4.7,
        "total_seats": 150,
        "registered_seats": 118,
        "skills": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"],
        "agenda": "14:00 eBPF in Action, 15:30 Multi-cluster Service Mesh, 17:00 Panel Q&A & Networking.",
        "is_featured": 0
    },
    {
        "id": "ev-4",
        "title": "CodeSprint: National Algorithmic Challenge",
        "description": "Speed algorithmic coding contest testing dynamic programming, graph invariants, and optimization. Real-time leaderboard with instant compile feedback.",
        "category": "coding_contests",
        "event_type": "contest",
        "format": "online",
        "price_type": "free",
        "price": 0.0,
        "date": "2026-11-15",
        "start_time": "16:00",
        "end_time": "19:00",
        "venue": "EventSphere Virtual Arena",
        "city": "Online",
        "location": "Online / Remote",
        "banner_url": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
        "organizer_name": "Competitive Coders Guild",
        "organizer_email": "contest@codeguild.dev",
        "organizer_verified": 1,
        "organizer_rating": 4.6,
        "total_seats": 500,
        "registered_seats": 342,
        "skills": ["C++", "Python", "Data Structures", "Algorithms"],
        "agenda": "16:00 4 Problems Unlocked, 18:30 Submission Freeze, 19:00 Final Reveal.",
        "is_featured": 1
    },
    {
        "id": "ev-5",
        "title": "GreenCity Urban Planting & STEM Tech Drive",
        "description": "Community volunteer initiative installing smart IoT soil moisture sensors alongside tree plantation in urban park corridors. Equipment provided.",
        "category": "volunteering",
        "event_type": "volunteering",
        "format": "offline",
        "price_type": "free",
        "price": 0.0,
        "date": "2026-11-15",
        "start_time": "08:00",
        "end_time": "12:00",
        "venue": "Cubbon Central Green Reserve",
        "city": "Bengaluru",
        "location": "Bengaluru, Karnataka",
        "banner_url": "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80",
        "organizer_name": "Civic Ecology Collective",
        "organizer_email": "volunteer@civicecology.org",
        "organizer_verified": 1,
        "organizer_rating": 4.9,
        "total_seats": 80,
        "registered_seats": 67,
        "skills": ["IoT", "Hardware", "Community", "Environmental"],
        "agenda": "08:00 Orientation, 08:30 Tree planting & sensor setup, 11:30 Refreshments.",
        "is_featured": 0
    },
    {
        "id": "ev-6",
        "title": "React 19 & Next.js Performance Camp",
        "description": "Exploring Server Actions, compiler optimizations, asset preloading, and partial prerendering in real-world high traffic ecommerce platforms.",
        "category": "workshops",
        "event_type": "workshop",
        "format": "offline",
        "price_type": "paid",
        "price": 15.0,
        "date": "2026-11-16",
        "start_time": "18:00",
        "end_time": "21:00",
        "venue": "DevSpace Studio, Indiranagar",
        "city": "Bengaluru",
        "location": "Bengaluru, Karnataka",
        "banner_url": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80",
        "organizer_name": "Frontend Guild South",
        "organizer_email": "team@frontendguild.org",
        "organizer_verified": 1,
        "organizer_rating": 4.8,
        "total_seats": 45,
        "registered_seats": 41,
        "skills": ["React", "TypeScript", "Next.js", "Tailwind CSS"],
        "agenda": "18:00 React 19 Compiler Deep Dive, 19:30 Server Action Patterns, 20:30 Q&A.",
        "is_featured": 0
    },
    {
        "id": "ev-7",
        "title": "FinTech Decentralized Settlement Hackathon",
        "description": "Build next-gen cross-border programmable payments, compliance verification engines, and privacy-preserving account abstraction protocols.",
        "category": "hackathons",
        "event_type": "hackathon",
        "format": "offline",
        "price_type": "free",
        "price": 0.0,
        "date": "2026-11-20",
        "start_time": "09:30",
        "end_time": "20:00",
        "venue": "FinTech Exchange Complex, Koramangala",
        "city": "Bengaluru",
        "location": "Bengaluru, Karnataka",
        "banner_url": "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800&q=80",
        "organizer_name": "Open Finance Initiative",
        "organizer_email": "hack@openfinance.io",
        "organizer_verified": 1,
        "organizer_rating": 4.7,
        "total_seats": 180,
        "registered_seats": 140,
        "skills": ["FastAPI", "PostgreSQL", "Web3", "React", "REST APIs"],
        "agenda": "09:30 API Keys Handout, 11:00 Mentor Sync, 18:00 Submissions.",
        "is_featured": 1
    },
    {
        "id": "ev-8",
        "title": "UI/UX Design Systems & Motion Lab",
        "description": "Learn to structure enterprise design tokens, configure Figma variables, and hand off pixel-perfect Tailwind animation components without layout shift.",
        "category": "workshops",
        "event_type": "workshop",
        "format": "offline",
        "price_type": "paid",
        "price": 19.0,
        "date": "2026-11-18",
        "start_time": "15:00",
        "end_time": "18:30",
        "venue": "Studio ArtLab, HSR Layout",
        "city": "Bengaluru",
        "location": "Bengaluru, Karnataka",
        "banner_url": "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80",
        "organizer_name": "DesignCraft Collective",
        "organizer_email": "hello@designcraft.studio",
        "organizer_verified": 1,
        "organizer_rating": 4.9,
        "total_seats": 50,
        "registered_seats": 38,
        "skills": ["Figma", "UI/UX", "Tailwind CSS", "Design Systems"],
        "agenda": "15:00 Token Architecture, 16:30 Motion Prototyping, 18:00 Portfolio Reviews.",
        "is_featured": 0
    },
    {
        "id": "ev-9",
        "title": "HealthTech AI & Medical Imaging Meetup",
        "description": "Clinicians and ML researchers present practical deployment of DICOM image segmentation and automated EHR clinical summary pipelines.",
        "category": "tech_meetups",
        "event_type": "meetup",
        "format": "offline",
        "price_type": "free",
        "price": 0.0,
        "date": "2026-11-19",
        "start_time": "17:30",
        "end_time": "20:30",
        "venue": "BioTech Research Wing, Electronic City",
        "city": "Bengaluru",
        "location": "Bengaluru, Karnataka",
        "banner_url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
        "organizer_name": "Digital Health Forum",
        "organizer_email": "forum@digitalhealth.org",
        "organizer_verified": 1,
        "organizer_rating": 4.8,
        "total_seats": 90,
        "registered_seats": 74,
        "skills": ["PyTorch", "Python", "HealthTech", "FastAPI"],
        "agenda": "17:30 Case Study: Automated Segmentation, 19:00 Ethics & HIPAA, 20:00 Mixer.",
        "is_featured": 0
    },
    {
        "id": "ev-10",
        "title": "DevOps & SRE Chaos Engineering Drill",
        "description": "Live cluster failure simulations! Inject latency, crash control planes, test failovers under load, and verify automated rollbacks.",
        "category": "workshops",
        "event_type": "workshop",
        "format": "offline",
        "price_type": "paid",
        "price": 20.0,
        "date": "2026-11-21",
        "start_time": "10:00",
        "end_time": "14:00",
        "venue": "Cloud Foundry Labs, Whitefield",
        "city": "Bengaluru",
        "location": "Bengaluru, Karnataka",
        "banner_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
        "organizer_name": "Reliability Engineering Guild",
        "organizer_email": "chaos@sreguild.io",
        "organizer_verified": 1,
        "organizer_rating": 4.7,
        "total_seats": 40,
        "registered_seats": 36,
        "skills": ["Docker", "Kubernetes", "Linux", "CI/CD"],
        "agenda": "10:00 Litmus Chaos Lab, 11:30 Multi-AZ Failover, 13:00 Post-Mortem Analysis.",
        "is_featured": 0
    },
    {
        "id": "ev-11",
        "title": "Kids Who Code: Weekend Volunteer Mentorship",
        "description": "Inspire middle schoolers through interactive Scratch and micro:bit hardware programming workshops. Mentors pair 1:2 with students.",
        "category": "volunteering",
        "event_type": "volunteering",
        "format": "offline",
        "price_type": "free",
        "price": 0.0,
        "date": "2026-11-22",
        "start_time": "09:30",
        "end_time": "13:30",
        "venue": "Public STEM Center, Jayanagar",
        "city": "Bengaluru",
        "location": "Bengaluru, Karnataka",
        "banner_url": "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
        "organizer_name": "STEM For All Trust",
        "organizer_email": "mentors@stemforall.ngo",
        "organizer_verified": 1,
        "organizer_rating": 5.0,
        "total_seats": 35,
        "registered_seats": 29,
        "skills": ["Python", "Scratch", "Community", "EdTech"],
        "agenda": "09:30 Mentor Briefing, 10:15 Student Sessions, 12:45 Showcase & Awards.",
        "is_featured": 0
    },
    {
        "id": "ev-12",
        "title": "High Frequency Data Streaming & Rust",
        "description": "Architecting low-latency message buses using Rust, Apache Kafka, and io_uring with zero-copy deserialization patterns.",
        "category": "tech_meetups",
        "event_type": "meetup",
        "format": "offline",
        "price_type": "free",
        "price": 0.0,
        "date": "2026-11-23",
        "start_time": "18:00",
        "end_time": "21:00",
        "venue": "WeWork Galaxy, Residency Road",
        "city": "Bengaluru",
        "location": "Bengaluru, Karnataka",
        "banner_url": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80",
        "organizer_name": "Systems Programming Forum",
        "organizer_email": "systems@rustblr.org",
        "organizer_verified": 1,
        "organizer_rating": 4.8,
        "total_seats": 70,
        "registered_seats": 62,
        "skills": ["Rust", "FastAPI", "Data Structures", "Docker"],
        "agenda": "18:00 Rust Concurrency Models, 19:30 Zero-Copy Benchmarking, 20:30 Socials.",
        "is_featured": 0
    },
    {
        "id": "ev-13",
        "title": "Global CyberDefense CTF Qualifier",
        "description": "Jeopardy style cybersecurity capture the flag covering binary exploitation, cryptography, web vulnerabilities, and reverse engineering.",
        "category": "coding_contests",
        "event_type": "contest",
        "format": "online",
        "price_type": "free",
        "price": 0.0,
        "date": "2026-11-28",
        "start_time": "10:00",
        "end_time": "22:00",
        "venue": "Online CTF Portal",
        "city": "Online",
        "location": "Online / Remote",
        "banner_url": "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
        "organizer_name": "ZeroDay Security Alliance",
        "organizer_email": "ctf@zerodaysec.org",
        "organizer_verified": 1,
        "organizer_rating": 4.9,
        "total_seats": 600,
        "registered_seats": 480,
        "skills": ["Security", "Python", "Linux", "Reverse Engineering"],
        "agenda": "10:00 Challenges Released, 16:00 Hint Pack 1, 22:00 Scoreboard Freezes.",
        "is_featured": 1
    },
    {
        "id": "ev-14",
        "title": "AI & Robotics Open Hardware Showcase",
        "description": "Hands-on exhibition of ROS2 mobile robots, drone telemetry, and stereo depth vision pipelines. Open source robot demonstrations.",
        "category": "tech_meetups",
        "event_type": "meetup",
        "format": "offline",
        "price_type": "free",
        "price": 0.0,
        "date": "2026-11-29",
        "start_time": "11:00",
        "end_time": "16:00",
        "venue": "MakerSpace Central, Bellandur",
        "city": "Bengaluru",
        "location": "Bengaluru, Karnataka",
        "banner_url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
        "organizer_name": "Maker Community Trust",
        "organizer_email": "maker@roboticsblr.org",
        "organizer_verified": 1,
        "organizer_rating": 4.6,
        "total_seats": 120,
        "registered_seats": 85,
        "skills": ["Python", "PyTorch", "Robotics", "Hardware"],
        "agenda": "11:00 Robot Arena Open, 13:00 Lightning Hardware Talks, 15:00 Drone Swarm Demo.",
        "is_featured": 0
    },
    {
        "id": "ev-15",
        "title": "HyperHack 2026: AI & Agents Global Hackathon (Unofficial Mirror)",
        "description": "Register here for the HyperHack 2026 AI hackathon. Fast checkin available.",
        "category": "hackathons",
        "event_type": "hackathon",
        "format": "offline",
        "price_type": "free",
        "price": 0.0,
        "date": "2026-11-14",
        "start_time": "09:00",
        "end_time": "21:00",
        "venue": "Innovation Hub, Tech Park Phase 2",
        "city": "Bengaluru",
        "location": "Bengaluru, Karnataka",
        "banner_url": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
        "organizer_name": "TechSquad Events",
        "organizer_email": "techsquad199@tempmail.com",
        "organizer_verified": 0,
        "organizer_rating": 2.1,
        "total_seats": 50,
        "registered_seats": 4,
        "skills": ["Python", "AI"],
        "agenda": "TBD",
        "is_featured": 0
    },
    {
        "id": "ev-16",
        "title": "Autonomous Drone Fleet Mapping Workshop",
        "description": "Learn autonomous waypoint navigation, photogrammetry stitching, and LIDAR point cloud visualization using open-source flight controllers.",
        "category": "workshops",
        "event_type": "workshop",
        "format": "offline",
        "price_type": "paid",
        "price": 30.0,
        "date": "2026-11-30",
        "start_time": "13:00",
        "end_time": "17:00",
        "venue": "Aerospace Hangar, Yelahanka",
        "city": "Bengaluru",
        "location": "Bengaluru, Karnataka",
        "banner_url": "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80",
        "organizer_name": "AeroFlight Lab",
        "organizer_email": "flight@aerolab.io",
        "organizer_verified": 1,
        "organizer_rating": 4.8,
        "total_seats": 30,
        "registered_seats": 24,
        "skills": ["Python", "Robotics", "IoT"],
        "agenda": "13:00 Flight Safety, 14:00 Mission Planning, 15:30 Point Cloud Processing.",
        "is_featured": 0
    }
]

def init_db(force_reset: bool = False):
    conn = get_connection()
    cursor = conn.cursor()

    if force_reset:
        cursor.execute("DROP TABLE IF EXISTS demand_votes")
        cursor.execute("DROP TABLE IF EXISTS community_demands")
        cursor.execute("DROP TABLE IF EXISTS reports")
        cursor.execute("DROP TABLE IF EXISTS team_invitations")
        cursor.execute("DROP TABLE IF EXISTS team_members")
        cursor.execute("DROP TABLE IF EXISTS teams")
        cursor.execute("DROP TABLE IF EXISTS sessions")
        cursor.execute("DROP TABLE IF EXISTS registrations")
        cursor.execute("DROP TABLE IF EXISTS planner_items")
        cursor.execute("DROP TABLE IF EXISTS bookmarks")
        cursor.execute("DROP TABLE IF EXISTS users")
        cursor.execute("DROP TABLE IF EXISTS events")

    # Create tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        event_type TEXT NOT NULL,
        format TEXT NOT NULL,
        price_type TEXT NOT NULL,
        price REAL DEFAULT 0.0,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        venue TEXT NOT NULL,
        city TEXT NOT NULL,
        location TEXT NOT NULL,
        locality TEXT DEFAULT 'Koramangala',
        latitude REAL DEFAULT 12.9352,
        longitude REAL DEFAULT 77.6245,
        status TEXT DEFAULT 'active',
        banner_url TEXT,
        organizer_name TEXT NOT NULL,
        organizer_email TEXT NOT NULL,
        organizer_verified INTEGER DEFAULT 0,
        organizer_rating REAL DEFAULT 4.0,
        total_seats INTEGER DEFAULT 100,
        registered_seats INTEGER DEFAULT 0,
        skills TEXT,
        agenda TEXT,
        is_featured INTEGER DEFAULT 0,
        organizer_id TEXT DEFAULT 'u-organizer',
        source_url TEXT DEFAULT 'https://luma.com/event-demo',
        submission_method TEXT DEFAULT 'manual',
        review_status TEXT DEFAULT 'reviewed',
        is_demo INTEGER DEFAULT 1,
        moderation_notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        experience_level TEXT NOT NULL,
        bio TEXT,
        avatar_url TEXT,
        skills TEXT,
        interests TEXT,
        github TEXT,
        email TEXT UNIQUE,
        hackathons_won INTEGER DEFAULT 0,
        password_hash TEXT,
        goals TEXT,
        locality TEXT DEFAULT 'Koramangala',
        is_admin INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, event_id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS planner_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, event_id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        attendee_name TEXT NOT NULL,
        attendee_email TEXT NOT NULL,
        ticket_code TEXT UNIQUE,
        phone TEXT,
        tshirt_size TEXT DEFAULT 'M',
        dietary TEXT DEFAULT 'None',
        github_linkedin TEXT,
        status TEXT DEFAULT 'confirmed',
        cancellation_reason TEXT,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, event_id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        leader_id TEXT NOT NULL,
        required_roles TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, user_id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS team_invitations (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        from_user_id TEXT NOT NULL,
        to_user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        reporter_user_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        details TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS community_demands (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        suggested_locality TEXT NOT NULL,
        user_id TEXT NOT NULL,
        votes_count INTEGER DEFAULT 1,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS demand_votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        demand_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(demand_id, user_id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        actor_user_id TEXT NOT NULL,
        target_id TEXT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # --- Schema Migrations for existing databases ---
    def add_col_if_missing(table: str, col_def: str):
        col_name = col_def.split()[0]
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_def}")
        except sqlite3.OperationalError:
            pass # already exists

    add_col_if_missing("users", "password_hash TEXT")
    add_col_if_missing("users", "goals TEXT")
    add_col_if_missing("users", "locality TEXT DEFAULT 'Koramangala'")
    add_col_if_missing("users", "is_admin INTEGER DEFAULT 0")
    add_col_if_missing("users", "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")

    add_col_if_missing("events", "locality TEXT DEFAULT 'Koramangala'")
    add_col_if_missing("events", "latitude REAL DEFAULT 12.9352")
    add_col_if_missing("events", "longitude REAL DEFAULT 77.6245")
    add_col_if_missing("events", "status TEXT DEFAULT 'active'")
    add_col_if_missing("events", "organizer_id TEXT DEFAULT 'u-organizer'")
    add_col_if_missing("events", "source_url TEXT DEFAULT 'https://luma.com/event-demo'")
    add_col_if_missing("events", "submission_method TEXT DEFAULT 'manual'")
    add_col_if_missing("events", "review_status TEXT DEFAULT 'reviewed'")
    add_col_if_missing("events", "is_demo INTEGER DEFAULT 1")
    add_col_if_missing("events", "moderation_notes TEXT DEFAULT ''")
    add_col_if_missing("users", "is_verified_organizer INTEGER DEFAULT 0")

    add_col_if_missing("registrations", "ticket_code TEXT")
    add_col_if_missing("registrations", "phone TEXT")
    add_col_if_missing("registrations", "tshirt_size TEXT DEFAULT 'M'")
    add_col_if_missing("registrations", "dietary TEXT DEFAULT 'None'")
    add_col_if_missing("registrations", "github_linkedin TEXT")
    add_col_if_missing("registrations", "status TEXT DEFAULT 'confirmed'")
    add_col_if_missing("registrations", "cancellation_reason TEXT")

    # Import auth for password hashing
    from auth import hash_password
    default_pwd_hash = hash_password("password123")

    # Update any existing users missing password_hash
    cursor.execute("UPDATE users SET password_hash = ? WHERE password_hash IS NULL OR password_hash = ''", (default_pwd_hash,))
    cursor.execute("UPDATE users SET is_admin = 1 WHERE id = 'u-admin'")
    cursor.execute("UPDATE users SET is_admin = 0 WHERE id != 'u-admin'")
    cursor.execute("UPDATE users SET goals = '[\"Win Hackathons\", \"AI/Agents Upskilling\", \"Find Teammates\"]' WHERE id = 'u-1' AND (goals IS NULL OR goals = '')")

    # Check if users already seeded
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]

    if user_count == 0:
        for u in SEED_USERS:
            is_adm = u.get("is_admin", 0)
            user_goals = json.dumps(u.get("goals", ["Win Hackathons", "Find Teammates", "Tech Networking"]))
            cursor.execute("""
            INSERT OR IGNORE INTO users (
                id, name, role, experience_level, bio, avatar_url, skills, interests, github, email, hackathons_won,
                password_hash, goals, locality, is_admin
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                u["id"], u["name"], u["role"], u["experience_level"], u["bio"],
                u["avatar_url"], json.dumps(u["skills"]), json.dumps(u.get("interests", [])),
                u.get("github", ""), u["email"], u.get("hackathons_won", 0),
                default_pwd_hash, user_goals, u.get("locality", "Koramangala"), is_adm
            ))
    else:
        for u in SEED_USERS:
            cursor.execute("SELECT id FROM users WHERE id = ?", (u["id"],))
            if not cursor.fetchone():
                is_adm = u.get("is_admin", 0)
                cursor.execute("""
                INSERT OR IGNORE INTO users (
                    id, name, role, experience_level, bio, avatar_url, skills, interests, github, email, hackathons_won,
                    password_hash, goals, locality, is_admin
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    u["id"], u["name"], u["role"], u["experience_level"], u["bio"],
                    u["avatar_url"], json.dumps(u["skills"]), json.dumps(u.get("interests", [])),
                    u.get("github", ""), u["email"], u.get("hackathons_won", 0),
                    default_pwd_hash, json.dumps(["Win Hackathons", "Find Teammates", "Tech Networking"]),
                    u.get("locality", "Koramangala"), is_adm
                ))

    # Update localities & coordinates on known seed events if missing
    EVENT_LOCALITY_MAP = {
        "ev-1": ("Whitefield", 12.9698, 77.7499),
        "ev-2": ("Indiranagar", 12.9784, 77.6408),
        "ev-3": ("Koramangala", 12.9352, 77.6245),
        "ev-4": ("Online", 0.0, 0.0),
        "ev-5": ("Central Bangalore", 12.9767, 77.5928),
        "ev-6": ("Indiranagar", 12.9784, 77.6408),
        "ev-7": ("Koramangala", 12.9352, 77.6245),
        "ev-8": ("HSR Layout", 12.9121, 77.6446),
        "ev-9": ("Electronic City", 12.8399, 77.6770),
        "ev-10": ("Whitefield", 12.9698, 77.7499),
        "ev-11": ("Jayanagar", 12.9308, 77.5838),
        "ev-12": ("Central Bangalore", 12.9720, 77.6070),
        "ev-13": ("Online", 0.0, 0.0),
        "ev-14": ("Bellandur", 12.9260, 77.6762),
        "ev-15": ("Whitefield", 12.9698, 77.7499),
        "ev-16": ("Yelahanka", 13.1007, 77.5963),
    }

    for eid, (loc, lat, lng) in EVENT_LOCALITY_MAP.items():
        cursor.execute("UPDATE events SET locality = ?, latitude = ?, longitude = ? WHERE id = ? AND (locality IS NULL OR locality = 'Koramangala')", (loc, lat, lng, eid))

    # Update any registrations without ticket_code
    cursor.execute("SELECT id, event_id FROM registrations WHERE ticket_code IS NULL OR ticket_code = ''")
    for reg_id, ev_id in cursor.fetchall():
        code = f"ES-{ev_id.upper()}-{uuid.uuid4().hex[:6].upper()}"
        cursor.execute("UPDATE registrations SET ticket_code = ?, status = 'confirmed' WHERE id = ?", (code, reg_id))

    # Check if events already seeded
    cursor.execute("SELECT COUNT(*) FROM events")
    count = cursor.fetchone()[0]

    if count == 0:
        for ev in SEED_EVENTS:
            loc_info = EVENT_LOCALITY_MAP.get(ev["id"], ("Koramangala", 12.9352, 77.6245))
            cursor.execute("""
            INSERT INTO events (
                id, title, description, category, event_type, format, price_type, price,
                date, start_time, end_time, venue, city, location, locality, latitude, longitude, banner_url,
                organizer_name, organizer_email, organizer_verified, organizer_rating,
                total_seats, registered_seats, skills, agenda, is_featured
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                ev["id"], ev["title"], ev["description"], ev["category"], ev["event_type"],
                ev["format"], ev["price_type"], ev["price"], ev["date"], ev["start_time"],
                ev["end_time"], ev["venue"], ev["city"], ev["location"], loc_info[0], loc_info[1], loc_info[2], ev["banner_url"],
                ev["organizer_name"], ev["organizer_email"], ev["organizer_verified"],
                ev["organizer_rating"], ev["total_seats"], ev["registered_seats"],
                json.dumps(ev["skills"]), ev["agenda"], ev["is_featured"]
            ))

        cursor.execute("INSERT OR IGNORE INTO planner_items (user_id, event_id) VALUES ('u-1', 'ev-1')")
        cursor.execute("INSERT OR IGNORE INTO planner_items (user_id, event_id) VALUES ('u-1', 'ev-2')")
        cursor.execute("INSERT OR IGNORE INTO bookmarks (user_id, event_id) VALUES ('u-1', 'ev-1')")
        cursor.execute("INSERT OR IGNORE INTO bookmarks (user_id, event_id) VALUES ('u-1', 'ev-4')")
        cursor.execute("""
        INSERT OR IGNORE INTO registrations (user_id, event_id, attendee_name, attendee_email, ticket_code, phone, tshirt_size, status)
        VALUES ('u-1', 'ev-1', 'Aarav Sharma', 'aarav.sharma@demo.eventsphere.io', 'ES-EV-1-DEMO01', '+91 98765 43210', 'L', 'confirmed')
        """)

    # Seed initial community demands if empty
    cursor.execute("SELECT COUNT(*) FROM community_demands")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO community_demands (id, title, description, category, suggested_locality, user_id, votes_count)
        VALUES
        ('dem-1', 'Rust & WebAssembly High Performance Systems Workshop', 'Need a hands-on zero-cost abstractions and WASM micro-runtime workshop with real-world benchmarking.', 'workshops', 'Indiranagar', 'u-2', 42),
        ('dem-2', 'Autonomous AI Agents 24h Hackathon', 'A weekend sprint specifically focused on multi-agent collaboration with LangGraph and local LLM fine-tuning.', 'hackathons', 'Koramangala', 'u-1', 68),
        ('dem-3', 'GreenTech & Solar IoT Hardware Hack', 'Prototyping solar telemetry and carbon footprint tracking on open hardware with ESP32.', 'volunteering', 'Whitefield', 'u-4', 27)
        """)
        cursor.execute("INSERT OR IGNORE INTO demand_votes (demand_id, user_id) VALUES ('dem-2', 'u-1')")

    # Seed initial team and sample invitation if empty
    cursor.execute("SELECT COUNT(*) FROM teams")
    if cursor.fetchone()[0] == 0:
        team_id = "team-agentic-titans"
        cursor.execute("""
        INSERT INTO teams (id, event_id, name, description, leader_id, required_roles)
        VALUES (?, 'ev-1', 'Agentic Titans', 'Building autonomous multi-agent customer support with deterministic fallback graphs.', 'u-1', ?)
        """, (team_id, json.dumps(["Backend Developer", "AI/ML Engineer", "UI/UX Designer"])))
        cursor.execute("INSERT OR IGNORE INTO team_members (team_id, user_id, role) VALUES (?, 'u-1', 'Frontend Developer')", (team_id,))
        
        # Seed an invitation from u-1 to u-2 (Priya Nair)
        inv_id = "inv-demo-1"
        cursor.execute("""
        INSERT OR IGNORE INTO team_invitations (id, team_id, from_user_id, to_user_id, role, message, status)
        VALUES (?, ?, 'u-1', 'u-2', 'Backend Developer', 'Hey Priya, love your FastAPI and PostgreSQL track record! Join our squad for HyperHack 2026.', 'pending')
        """, (inv_id, team_id))

    # Seed a sample moderation report on ev-15 (Unofficial Mirror) if empty
    cursor.execute("SELECT COUNT(*) FROM reports")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO reports (id, event_id, reporter_user_id, reason, details, status)
        VALUES ('rep-1', 'ev-15', 'u-1', 'duplicate', 'This event appears to be an unofficial copy of the main HyperHack 2026 listing with unverified host credentials.', 'pending')
        """)


    conn.commit()
    conn.close()

def row_to_event(row: sqlite3.Row) -> Dict[str, Any]:
    d = dict(row)
    if isinstance(d.get("skills"), str):
        try:
            d["skills"] = json.loads(d["skills"])
        except Exception:
            d["skills"] = [s.strip() for s in d["skills"].split(",") if s.strip()]
    if "locality" not in d or not d["locality"]:
        d["locality"] = "Koramangala"
    if "latitude" not in d or d["latitude"] is None:
        d["latitude"] = 12.9352
    if "longitude" not in d or d["longitude"] is None:
        d["longitude"] = 77.6245
    if "organizer_id" not in d or not d["organizer_id"]:
        d["organizer_id"] = "u-organizer"
    if "source_url" not in d or not d["source_url"]:
        d["source_url"] = "https://luma.com/event-demo"
    if "submission_method" not in d or not d["submission_method"]:
        d["submission_method"] = "manual"
    if "review_status" not in d or not d["review_status"]:
        d["review_status"] = "reviewed"
    if "is_demo" not in d or d["is_demo"] is None:
        d["is_demo"] = 1
    return d

def row_to_user(row: sqlite3.Row) -> Dict[str, Any]:
    d = dict(row)
    # Remove password_hash from general user output for security
    if "password_hash" in d:
        del d["password_hash"]
    if isinstance(d.get("skills"), str):
        try:
            d["skills"] = json.loads(d["skills"])
        except Exception:
            d["skills"] = []
    if isinstance(d.get("interests"), str):
        try:
            d["interests"] = json.loads(d["interests"])
        except Exception:
            d["interests"] = []
    if isinstance(d.get("goals"), str):
        try:
            d["goals"] = json.loads(d["goals"])
        except Exception:
            d["goals"] = []
    elif not d.get("goals"):
        d["goals"] = ["Win Hackathons", "Find Teammates", "Tech Networking"]
    if "is_admin" not in d:
        d["is_admin"] = 0
    return d

