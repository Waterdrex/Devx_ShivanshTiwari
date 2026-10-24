from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class EventCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=10)
    category: str = Field(..., example="hackathons")
    event_type: str = Field(..., example="hackathon")
    format: str = Field(..., example="offline") # 'online' or 'offline'
    price_type: str = Field(..., example="free") # 'free' or 'paid'
    price: float = Field(0.0, ge=0)
    date: str = Field(..., example="2026-11-20")
    start_time: str = Field(..., example="10:00")
    end_time: str = Field(..., example="18:00")
    venue: str = Field(..., example="Innovation Hub, Tech Park")
    city: str = Field(..., example="Bengaluru")
    location: str = Field(..., example="Bengaluru, Karnataka")
    locality: Optional[str] = "Koramangala"
    latitude: Optional[float] = 12.9352
    longitude: Optional[float] = 77.6245
    banner_url: Optional[str] = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"
    organizer_name: str = Field(..., example="Bangalore Tech Club")
    organizer_email: str = Field(..., example="contact@techclub.org")
    organizer_verified: int = Field(0, ge=0, le=1)
    total_seats: int = Field(100, ge=1)
    skills: List[str] = []
    agenda: Optional[str] = ""

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    event_type: Optional[str] = None
    format: Optional[str] = None
    price_type: Optional[str] = None
    price: Optional[float] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    location: Optional[str] = None
    locality: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    banner_url: Optional[str] = None
    total_seats: Optional[int] = None
    skills: Optional[List[str]] = None
    agenda: Optional[str] = None

# Auth models
class UserSignup(BaseModel):
    name: str = Field(..., min_length=2)
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    role: Optional[str] = "Full Stack Developer"
    experience_level: Optional[str] = "Intermediate"
    bio: Optional[str] = "Excited tech innovator building high-impact hackathon projects."
    skills: Optional[List[str]] = ["React", "TypeScript", "Python"]
    interests: Optional[List[str]] = ["AI/ML", "HealthTech"]
    goals: Optional[List[str]] = ["Win Hackathons", "Find Teammates"]
    locality: Optional[str] = "Koramangala"

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdateProfile(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    experience_level: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    goals: Optional[List[str]] = None
    locality: Optional[str] = None
    github: Optional[str] = None

# Enhanced Event Registration
class RegisterRequest(BaseModel):
    user_id: Optional[str] = "u-1"
    attendee_name: str
    attendee_email: str
    phone: Optional[str] = "+91 98765 43210"
    tshirt_size: Optional[str] = "M"
    dietary: Optional[str] = "None"
    github_linkedin: Optional[str] = ""

class CancelRegistrationRequest(BaseModel):
    cancellation_reason: Optional[str] = "Schedule conflict or unable to attend"

# Bookmarks & Planner
class BookmarkToggleRequest(BaseModel):
    user_id: str = "u-1"
    event_id: str

class PlannerItemRequest(BaseModel):
    user_id: str = "u-1"
    event_id: str

# Opportunity Radar
class RadarQueryRequest(BaseModel):
    user_id: Optional[str] = "u-1"
    goals: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    max_budget: Optional[float] = None
    locality: Optional[str] = None

# Teams & Collaborations (TeamMatch 2.0)
class TeamCreateRequest(BaseModel):
    event_id: str
    name: str = Field(..., min_length=3, max_length=60)
    description: str = Field(..., min_length=10)
    required_roles: List[str] = ["Backend Developer", "AI/ML Engineer"]

class TeamInviteRequest(BaseModel):
    to_user_id: str
    role: str
    message: Optional[str] = "We would love to team up with you for this hackathon!"

class InviteRespondRequest(BaseModel):
    action: str = Field(..., example="accept") # 'accept' or 'reject'

class TeamMatchRequest(BaseModel):
    user_role: str = "Frontend Developer"
    user_skills: List[str] = ["React", "TypeScript", "Tailwind CSS"]
    experience_level: str = "Intermediate"
    interests: List[str] = ["AI/ML", "HealthTech", "FinTech"]
    target_event_id: Optional[str] = None

# Trust & Safety
class ReportCreateRequest(BaseModel):
    reason: str = Field(..., example="duplicate") # 'scam', 'duplicate', 'inaccurate_venue', 'spam', 'safety'
    details: str = Field(..., min_length=5)

class ReportResolveRequest(BaseModel):
    action: str = Field(..., example="dismiss") # 'dismiss', 'flag_event', 'unpublish_event'

# Community Demand
class DemandCreateRequest(BaseModel):
    title: str = Field(..., min_length=5, max_length=100)
    description: str = Field(..., min_length=15)
    category: str = Field("hackathons", example="hackathons")
    suggested_locality: str = Field("Indiranagar", example="Indiranagar")
