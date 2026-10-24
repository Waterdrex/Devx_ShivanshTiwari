export interface TrustSignal {
  name: string;
  score: number;
  max: number;
  status: 'passed' | 'warning' | 'failed';
  description: string;
}

export interface DuplicateInfo {
  duplicate_event_id: string;
  matched_title: string;
  similarity: number;
  reason: string;
}

export interface TrustScore {
  score: number;
  tier: 'High Trust' | 'Moderate Trust' | 'Needs Review';
  badge_color: 'emerald' | 'amber' | 'rose';
  signals: TrustSignal[];
  is_duplicate_flagged: boolean;
  duplicate_info?: DuplicateInfo | null;
  demo_disclaimer: string;
}

export interface RadarScoreInfo {
  radar_score: number;
  tier: string;
  badge_color: string;
  goal_score: number;
  skill_score: number;
  interest_score: number;
  practicality_score: number;
  matched_goals: string[];
  skill_overlap: string[];
  explanation: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  event_type: string;
  format: 'online' | 'offline';
  price_type: 'free' | 'paid';
  price: number;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  city: string;
  location: string;
  locality?: string;
  latitude?: number;
  longitude?: number;
  banner_url?: string;
  organizer_name: string;
  organizer_email: string;
  organizer_verified: number;
  organizer_rating: number;
  total_seats: number;
  registered_seats: number;
  available_seats?: number;
  skills: string[];
  agenda?: string;
  is_featured?: number;
  trust?: TrustScore;
  radar?: RadarScoreInfo;
  is_bookmarked?: boolean;
  is_in_planner?: boolean;
  is_registered?: boolean;
  user_ticket_code?: string;
  has_conflict?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  experience_level: string;
  bio: string;
  avatar_url: string;
  skills: string[];
  interests: string[];
  goals?: string[];
  locality?: string;
  github?: string;
  email?: string;
  hackathons_won: number;
  is_admin?: number;
}

export interface TeamMatchCandidate {
  candidate: UserProfile;
  compatibility_pct: number;
  role_score: number;
  skills_brought: string[];
  shared_skills: string[];
  shared_interests: string[];
  missing_team_domains: string[];
  match_explanation: string;
}

export interface ConflictItem {
  event_a_id: string;
  event_a_title: string;
  event_a_time: string;
  event_b_id: string;
  event_b_title: string;
  event_b_time: string;
  date: string;
  overlap_minutes: number;
  warning: string;
}

export interface TravelConflictItem {
  event_a_id: string;
  event_a_title: string;
  event_a_locality: string;
  event_a_end: string;
  event_b_id: string;
  event_b_title: string;
  event_b_locality: string;
  event_b_start: string;
  date: string;
  distance_km: number;
  required_transit_minutes: number;
  available_gap_minutes: number;
  warning: string;
}

export interface PlannerScheduleResponse {
  count: number;
  schedule: EventItem[];
  has_conflicts: boolean;
  conflicts: ConflictItem[];
  travel_conflicts?: TravelConflictItem[];
  recommended_alternatives: EventItem[];
}

export interface RegistrationItem {
  id: number;
  user_id: string;
  event_id: string;
  attendee_name: string;
  attendee_email: string;
  ticket_code: string;
  phone?: string;
  tshirt_size?: string;
  dietary?: string;
  github_linkedin?: string;
  status: 'confirmed' | 'cancelled' | 'attended';
  cancellation_reason?: string;
  registered_at: string;
  title: string;
  banner_url?: string;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  city: string;
  locality?: string;
  category: string;
  format: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar_url: string;
  team_role: string;
  joined_at: string;
}

export interface TeamItem {
  id: string;
  event_id: string;
  name: string;
  description: string;
  leader_id: string;
  required_roles: string[];
  created_at: string;
  leader?: UserProfile;
  members: TeamMember[];
  event_title: string;
  event_date: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  from_user_id: string;
  to_user_id: string;
  role: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  team_name: string;
  team_desc?: string;
  event_title?: string;
  sender_name?: string;
  sender_avatar?: string;
  recipient_name?: string;
  recipient_avatar?: string;
}

export interface ModerationReport {
  id: string;
  event_id: string;
  reporter_user_id: string;
  reason: string;
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  event_title: string;
  organizer_name: string;
  reporter_name: string;
}

export interface PassportBadge {
  id: string;
  name: string;
  category: string;
  icon: string;
  earned: boolean;
  description: string;
}

export interface SkillEndorsement {
  skill: string;
  endorsements: number;
}

export interface GrowthPassport {
  user_id: string;
  user_name: string;
  tier_title: string;
  tier_level: number;
  xp: number;
  next_tier_xp: number;
  progress_pct: number;
  events_attended: number;
  teams_joined: number;
  hackathons_won: number;
  skills_verified: SkillEndorsement[];
  badges: PassportBadge[];
  active_registrations: any[];
}

export interface CommunityDemand {
  id: string;
  title: string;
  description: string;
  category: string;
  suggested_locality: string;
  user_id: string;
  votes_count: number;
  status: string;
  created_at: string;
  submitter_name: string;
  submitter_avatar?: string;
  has_voted?: boolean;
}

export interface LocalityInfo {
  name: string;
  latitude: number;
  longitude: number;
  event_count: number;
}

export interface OrganizerStats {
  total_events: number;
  total_registrations: number;
  total_capacity: number;
  occupancy_rate: number;
  average_trust_score: number;
  flagged_duplicates_count: number;
  flagged_duplicates: {
    event_id: string;
    event_title: string;
    organizer: string;
    duplicate_info: DuplicateInfo;
    trust_score: number;
  }[];
  events: EventItem[];
}
