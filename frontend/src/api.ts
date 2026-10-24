import {
  EventItem,
  PlannerScheduleResponse,
  TeamMatchCandidate,
  OrganizerStats,
  UserProfile,
  RegistrationItem,
  TeamItem,
  TeamInvitation,
  ModerationReport,
  GrowthPassport,
  CommunityDemand,
  LocalityInfo
} from './types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('eventsphere_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('eventsphere_token', token);
  } else {
    localStorage.removeItem('eventsphere_token');
  }
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ================= AUTH =================
export async function apiLogin(payload: { email: string; password: string }): Promise<{ token: string; user: UserProfile; message: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Login failed');
  setAuthToken(data.token);
  return data;
}

export async function apiSignup(payload: {
  name: string;
  email: string;
  password: string;
  role?: string;
  locality?: string;
  goals?: string[];
  skills?: string[];
}): Promise<{ token: string; user: UserProfile; message: string }> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Signup failed');
  setAuthToken(data.token);
  return data;
}

export async function apiLogout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: authHeaders(),
  });
  setAuthToken(null);
}

export async function apiGetMe(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Session expired');
  const data = await res.json();
  return data.user;
}

export async function apiUpdateProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to update profile');
  return data.user;
}

// ================= EVENTS & DISCOVERY =================
export async function fetchEvents(params?: {
  search?: string;
  category?: string;
  locality?: string;
  price_type?: string;
  format?: string;
  sort_by?: string;
  user_id?: string | null;
}): Promise<{ count: number; events: EventItem[]; demo_mode: boolean }> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.category && params.category !== 'all') query.set('category', params.category);
  if (params?.locality && params.locality !== 'all') query.set('locality', params.locality);
  if (params?.price_type && params.price_type !== 'all') query.set('price_type', params.price_type);
  if (params?.format && params.format !== 'all') query.set('format', params.format);
  if (params?.sort_by) query.set('sort_by', params.sort_by);
  if (params?.user_id) query.set('user_id', params.user_id);

  const res = await fetch(`${API_BASE}/events?${query.toString()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load events');
  return res.json();
}

export async function fetchEventById(id: string, userId = 'u-1'): Promise<EventItem> {
  const res = await fetch(`${API_BASE}/events/${id}?user_id=${userId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Event not found');
  return res.json();
}

export async function fetchLocalities(): Promise<{ localities: LocalityInfo[] }> {
  const res = await fetch(`${API_BASE}/localities`);
  if (!res.ok) throw new Error('Failed to load localities');
  return res.json();
}

export async function toggleBookmark(eventId: string, userId = 'u-1'): Promise<{ is_bookmarked: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/bookmarks/toggle`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ event_id: eventId, user_id: userId }),
  });
  if (!res.ok) throw new Error('Failed to toggle bookmark');
  return res.json();
}

// ================= ENHANCED REGISTRATION =================
export async function registerForEvent(
  eventId: string,
  payload: {
    attendee_name: string;
    attendee_email: string;
    phone?: string;
    tshirt_size?: string;
    dietary?: string;
    github_linkedin?: string;
    user_id?: string;
  }
): Promise<{ message: string; registered: boolean; already_registered?: boolean; ticket?: any }> {
  const res = await fetch(`${API_BASE}/events/${eventId}/register`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      user_id: payload.user_id || 'u-1',
      attendee_name: payload.attendee_name,
      attendee_email: payload.attendee_email,
      phone: payload.phone || '+91 98765 00000',
      tshirt_size: payload.tshirt_size || 'M',
      dietary: payload.dietary || 'None',
      github_linkedin: payload.github_linkedin || '',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Registration failed');
  return data;
}

export async function fetchMyRegistrations(userId?: string | null): Promise<{ count: number; registrations: RegistrationItem[] }> {
  if (!userId) {
    return { count: 0, registrations: [] };
  }
  const res = await fetch(`${API_BASE}/my-registrations?user_id=${userId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load registrations');
  return res.json();
}

export async function cancelRegistration(registrationId: number, reason?: string): Promise<{ message: string; status: string }> {
  const res = await fetch(`${API_BASE}/registrations/${registrationId}/cancel`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ cancellation_reason: reason || 'Unable to attend' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Cancellation failed');
  return data;
}

// ================= OPPORTUNITY RADAR =================
export async function fetchOpportunityRadar(userId?: string | null, maxBudget?: number): Promise<{
  user_profile: any;
  count: number;
  recommendations: EventItem[];
}> {
  const query = new URLSearchParams();
  if (userId) query.set('user_id', userId);
  if (maxBudget !== undefined && maxBudget !== null) query.set('max_budget', String(maxBudget));

  const res = await fetch(`${API_BASE}/opportunity-radar?${query.toString()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load opportunity radar');
  return res.json();
}

// ================= PLANNER =================
export async function fetchPlannerSchedule(userId?: string | null): Promise<PlannerScheduleResponse> {
  const url = userId ? `${API_BASE}/planner?user_id=${userId}` : `${API_BASE}/planner`;
  const res = await fetch(url, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load schedule');
  return res.json();
}

export async function addToPlanner(eventId: string, userId = 'u-1'): Promise<PlannerScheduleResponse & { message: string }> {
  const res = await fetch(`${API_BASE}/planner/add`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ event_id: eventId, user_id: userId }),
  });
  if (!res.ok) throw new Error('Failed to add to schedule');
  return res.json();
}

export async function removeFromPlanner(eventId: string, userId = 'u-1'): Promise<PlannerScheduleResponse & { message: string }> {
  const res = await fetch(`${API_BASE}/planner/${eventId}?user_id=${userId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to remove from schedule');
  return res.json();
}

// ================= TEAMMATCH 2.0 =================
export async function getTeamRecommendations(payload: {
  user_role: string;
  user_skills: string[];
  experience_level: string;
  interests: string[];
  target_event_id?: string;
}): Promise<{ total_candidates: number; matches: TeamMatchCandidate[] }> {
  const res = await fetch(`${API_BASE}/teammatch/recommend`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to compute team recommendations');
  return res.json();
}

export async function fetchTeams(eventId?: string): Promise<{ count: number; teams: TeamItem[] }> {
  const url = eventId ? `${API_BASE}/teams?event_id=${eventId}` : `${API_BASE}/teams`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch teams');
  return res.json();
}

export async function createTeam(payload: {
  event_id: string;
  name: string;
  description: string;
  required_roles: string[];
}): Promise<{ message: string; team_id: string }> {
  const res = await fetch(`${API_BASE}/teams`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to create team');
  return data;
}

export async function inviteTeammate(teamId: string, payload: { to_user_id: string; role: string; message: string }): Promise<{ message: string; invitation_id: string }> {
  const res = await fetch(`${API_BASE}/teams/${teamId}/invite`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to send invite');
  return data;
}

export async function fetchTeamInvitations(userId?: string | null): Promise<{ received: TeamInvitation[]; sent: TeamInvitation[] }> {
  const url = userId ? `${API_BASE}/team-invitations?user_id=${userId}` : `${API_BASE}/team-invitations`;
  const res = await fetch(url, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch team invitations');
  return res.json();
}

export async function respondToInvitation(invitationId: string, action: 'accept' | 'reject'): Promise<{ message: string; status: string }> {
  const res = await fetch(`${API_BASE}/team-invitations/${invitationId}/respond`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ action }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to respond to invitation');
  return data;
}

// ================= GROWTH PASSPORT =================
export async function fetchGrowthPassport(userId?: string | null): Promise<GrowthPassport> {
  const url = userId ? `${API_BASE}/passport?user_id=${userId}` : `${API_BASE}/passport`;
  const res = await fetch(url, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load growth passport');
  return res.json();
}

// ================= COMMUNITY DEMAND =================
export async function fetchCommunityDemands(userId?: string | null): Promise<{ count: number; demands: CommunityDemand[] }> {
  const url = userId ? `${API_BASE}/community-demands?user_id=${userId}` : `${API_BASE}/community-demands`;
  const res = await fetch(url, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load demands');
  return res.json();
}

export async function createCommunityDemand(payload: {
  title: string;
  description: string;
  category: string;
  suggested_locality: string;
}): Promise<{ message: string; demand_id: string }> {
  const res = await fetch(`${API_BASE}/community-demands`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to submit demand');
  return data;
}

export async function voteCommunityDemand(demandId: string, userId = 'u-1'): Promise<{ message: string; has_voted: boolean; votes_count: number }> {
  const res = await fetch(`${API_BASE}/community-demands/${demandId}/vote?user_id=${userId}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to vote');
  return data;
}

// ================= TRUST, SAFETY & ADMIN =================
export async function reportEvent(eventId: string, payload: { reason: string; details: string }): Promise<{ message: string; report_id: string }> {
  const res = await fetch(`${API_BASE}/events/${eventId}/report`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to submit report');
  return data;
}

export async function fetchAdminReports(status = 'pending'): Promise<{ count: number; reports: ModerationReport[] }> {
  const res = await fetch(`${API_BASE}/admin/reports?status_filter=${status}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load admin reports');
  return res.json();
}

export async function resolveAdminReport(reportId: string, action: 'dismiss' | 'flag_event' | 'unpublish_event'): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/admin/reports/${reportId}/resolve`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ action }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to resolve report');
  return data;
}

// ================= ORGANIZER & ADMIN =================
export async function fetchOrganizerStats(): Promise<OrganizerStats> {
  const res = await fetch(`${API_BASE}/organizer/stats`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load organizer metrics');
  return res.json();
}

export async function createEvent(eventData: Partial<EventItem>): Promise<{ message: string; event: EventItem; duplicate_warning?: any }> {
  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(eventData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail?.[0]?.msg || data.detail || 'Failed to create event');
  return data;
}

export async function deleteEvent(eventId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/events/${eventId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete event');
  return res.json();
}

export async function resetDemoDatabase(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/admin/reset`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to reset demo dataset');
  return res.json();
}

export async function fetchUsers(): Promise<{ users: UserProfile[] }> {
  const res = await fetch(`${API_BASE}/users`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch demo users');
  return res.json();
}
