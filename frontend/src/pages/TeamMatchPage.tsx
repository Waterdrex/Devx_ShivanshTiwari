import React, { useState, useEffect } from 'react';
import { 
  Users2, 
  Sparkles, 
  Award, 
  Briefcase, 
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  Send,
  X
} from 'lucide-react';
import { TeamMatchCandidate, TeamItem, TeamInvitation, UserProfile, EventItem } from '../types';
import { 
  getTeamRecommendations, 
  fetchTeams, 
  createTeam, 
  inviteTeammate, 
  fetchTeamInvitations, 
  respondToInvitation,
  fetchEvents 
} from '../api';

const AVAILABLE_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'AI/ML Engineer',
  'UI/UX Designer',
  'Full Stack Developer',
  'Mobile Developer',
  'DevOps / Cloud',
];

const SKILL_OPTIONS = [
  'React', 'TypeScript', 'Tailwind CSS', 'Next.js',
  'Python', 'FastAPI', 'PostgreSQL', 'Docker',
  'PyTorch', 'LangChain', 'OpenAI API', 'Vector DBs',
  'Figma', 'UI/UX', 'Flutter', 'AWS', 'Kubernetes'
];

const INTEREST_OPTIONS = [
  'AI/ML', 'HealthTech', 'FinTech', 'Developer Tools',
  'Web3', 'Social Impact', 'EdTech', 'Robotics', 'IoT'
];

interface Props {
  currentUser?: UserProfile | null;
  showToast?: (msg: string, type: 'success' | 'warning' | 'info') => void;
}

export const TeamMatchPage: React.FC<Props> = ({ currentUser, showToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'recommendations' | 'squads' | 'invitations'>('recommendations');

  // Matcher State
  const [selectedRole, setSelectedRole] = useState(currentUser?.role || 'Frontend Developer');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(currentUser?.skills || ['React', 'TypeScript', 'Tailwind CSS']);
  const [experienceLevel, setExperienceLevel] = useState(currentUser?.experience_level || 'Intermediate');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(currentUser?.interests || ['AI/ML', 'HealthTech']);
  
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<TeamMatchCandidate[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [invitations, setInvitations] = useState<{ received: TeamInvitation[]; sent: TeamInvitation[] }>({ received: [], sent: [] });
  const [events, setEvents] = useState<EventItem[]>([]);

  // Create Squad Modal
  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [squadName, setSquadName] = useState('');
  const [squadDesc, setSquadDesc] = useState('');
  const [squadEventId, setSquadEventId] = useState('ev-1');
  const [squadRoles, setSquadRoles] = useState('Backend Developer, AI/ML Engineer');
  const [submittingSquad, setSubmittingSquad] = useState(false);

  // Invite Modal
  const [inviteModalCandidate, setInviteModalCandidate] = useState<UserProfile | null>(null);
  const [inviteTeamId, setInviteTeamId] = useState('');
  const [inviteRole, setInviteRole] = useState('Backend Developer');
  const [inviteMessage, setInviteMessage] = useState('Hey! We would love to have you on our squad.');
  const [sendingInvite, setSendingInvite] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const data = await getTeamRecommendations({
        user_role: selectedRole,
        user_skills: selectedSkills,
        experience_level: experienceLevel,
        interests: selectedInterests,
      });
      setMatches(data.matches);
    } catch (err) {
      console.error('Failed to load team matches', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamsAndInvites = async () => {
    try {
      const [tData, iData, eData] = await Promise.all([
        fetchTeams(),
        fetchTeamInvitations(),
        fetchEvents()
      ]);
      setTeams(tData.teams);
      setInvitations(iData);
      setEvents(eData.events);
      if (tData.teams.length > 0 && !inviteTeamId) {
        setInviteTeamId(tData.teams[0].id);
      }
    } catch (err) {
      console.error('Failed to load teams or invites', err);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [selectedRole, selectedSkills, experienceLevel, selectedInterests]);

  useEffect(() => {
    loadTeamsAndInvites();
  }, []);

  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSquad(true);
    try {
      const roles = squadRoles.split(',').map(r => r.trim()).filter(Boolean);
      await createTeam({
        name: squadName,
        description: squadDesc,
        event_id: squadEventId,
        required_roles: roles,
      });
      showToast?.('Squad created successfully!', 'success');
      setShowCreateSquad(false);
      setSquadName('');
      setSquadDesc('');
      await loadTeamsAndInvites();
      setActiveSubTab('squads');
    } catch (err: any) {
      showToast?.(err.message || 'Failed to create squad', 'warning');
    } finally {
      setSubmittingSquad(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteModalCandidate || !inviteTeamId) {
      showToast?.('Please pick a squad to invite to', 'warning');
      return;
    }
    setSendingInvite(true);
    try {
      await inviteTeammate(inviteTeamId, {
        to_user_id: inviteModalCandidate.id,
        role: inviteRole,
        message: inviteMessage,
      });
      showToast?.(`Invitation sent to ${inviteModalCandidate.name}!`, 'success');
      setInviteModalCandidate(null);
      await loadTeamsAndInvites();
    } catch (err: any) {
      showToast?.(err.message || 'Failed to send invite', 'warning');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRespondInvite = async (invId: string, action: 'accept' | 'reject') => {
    try {
      const res = await respondToInvitation(invId, action);
      showToast?.(res.message, 'success');
      await loadTeamsAndInvites();
    } catch (err: any) {
      showToast?.(err.message || 'Action failed', 'warning');
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-theme shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="relative max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-600 dark:text-violet-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
            <span>TeamMatch 2.0 Engine</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-main tracking-tight">
            Find & Assemble Your Championship Squad
          </h1>

          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            Algorithmic role complementarity pairs you with ideal teammates. Create real squads, issue invitations, and accept teammates directly in the database.
          </p>
        </div>

        <button
          onClick={() => setShowCreateSquad(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-teal-500 text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-violet-900/30 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Squad</span>
        </button>
      </div>

      {/* Sub-Tabs: Matcher vs Active Squads vs Invitations */}
      <div className="flex bg-surface p-1.5 rounded-2xl border border-theme gap-1 overflow-x-auto shadow-sm">
        <button
          onClick={() => setActiveSubTab('recommendations')}
          className={`flex-1 min-w-[180px] py-2 px-4 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'recommendations'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-muted hover:text-main'
          }`}
        >
          Teammate Recommendations ({matches.length})
        </button>
        <button
          onClick={() => setActiveSubTab('squads')}
          className={`flex-1 min-w-[160px] py-2 px-4 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'squads'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-muted hover:text-main'
          }`}
        >
          Active Squads ({teams.length})
        </button>
        <button
          onClick={() => setActiveSubTab('invitations')}
          className={`flex-1 min-w-[160px] py-2 px-4 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'invitations'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-muted hover:text-main'
          }`}
        >
          Squad Invitations ({invitations.received.length})
        </button>
      </div>

      {/* TAB 1: ALGORITHMIC MATCHER */}
      {activeSubTab === 'recommendations' && (
        <div className="space-y-6">
          {/* Interactive Profile & Criteria Builder */}
          <div className="p-5 sm:p-6 rounded-3xl bg-surface border border-theme space-y-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              <span>Your Role & Stack In The Squad</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Primary Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-theme-secondary border border-theme text-main text-xs font-medium focus:outline-none focus:border-violet-500"
                >
                  {AVAILABLE_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Experience Level</label>
                <div className="flex gap-2">
                  {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setExperienceLevel(lvl)}
                      className={`flex-1 py-2 px-2 rounded-xl border text-center text-xs font-medium transition-all ${
                        experienceLevel === lvl
                          ? 'bg-violet-600/20 text-violet-700 dark:text-white border-violet-500 shadow-sm'
                          : 'bg-theme-secondary text-muted border-theme hover:text-main'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Domain Interests</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {INTEREST_OPTIONS.map((interest) => {
                    const active = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                          active
                            ? 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border-teal-500/50'
                            : 'bg-theme-secondary text-muted border-theme hover:text-main'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}{interest}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Skills Multi-Select */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Your Technical Skills
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_OPTIONS.map((skill) => {
                  const active = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all ${
                        active
                          ? 'bg-gradient-to-r from-violet-600 to-teal-500 text-white border-violet-400 shadow-sm'
                          : 'bg-theme-secondary text-muted border-theme hover:text-main'
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recommended Candidates List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-main flex items-center gap-2">
                <span>Ranked Compatible Teammates</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-800">
                  {matches.length} Matches
                </span>
              </h2>
              <span className="text-xs text-muted">Sorted by Synergy Algorithm</span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="h-56 rounded-3xl bg-surface border border-theme animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((item) => {
                  const user = item.candidate;
                  return (
                    <div
                      key={user.id}
                      className="p-5 rounded-3xl bg-surface border border-theme hover:border-violet-500/40 transition-all flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatar_url}
                              alt={user.name}
                              className="w-12 h-12 rounded-2xl object-cover border border-theme"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-main text-base">{user.name}</h3>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-theme-secondary text-muted border border-theme font-medium">
                                  {user.experience_level}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-0.5">{user.role}</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm">
                              <span>{item.compatibility_pct}%</span>
                              <span className="text-[10px] font-normal opacity-80">Match</span>
                            </div>
                            <span className="text-[10px] text-muted mt-1">Role Synergy: {item.role_score}/40</span>
                          </div>
                        </div>

                        <p className="text-xs text-muted mt-3 line-clamp-2 leading-relaxed">
                          {user.bio}
                        </p>

                        <div className="mt-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-500/30 text-xs text-violet-800 dark:text-violet-200 leading-relaxed flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400 shrink-0 mt-0.5" />
                          <span>{item.match_explanation}</span>
                        </div>

                        <div className="mt-3.5 space-y-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block">
                            Skills They Bring:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {item.skills_brought.length > 0 ? (
                              item.skills_brought.map((sk, i) => (
                                <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700 font-medium">
                                  +{sk}
                                </span>
                              ))
                            ) : (
                              user.skills.map((sk, i) => (
                                <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-theme-secondary text-muted border border-theme">
                                  {sk}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        {item.missing_team_domains.length > 0 && (
                          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300/80">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                            <span>Team still needs: {item.missing_team_domains.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-theme flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          <span>{user.hackathons_won} Wins</span>
                        </div>

                        <button
                          onClick={() => {
                            setInviteModalCandidate(user);
                            setInviteRole(user.role);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-violet-900/30 flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Invite to Squad</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE SQUADS */}
      {activeSubTab === 'squads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-main flex items-center gap-2">
              <span>Active Hackathon Squads</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-500/40">
                {teams.length} Squads
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((t) => (
              <div
                key={t.id}
                className="p-5 rounded-3xl bg-surface border border-theme hover:border-violet-500/40 transition-all space-y-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 border border-teal-300 dark:border-teal-800">
                      {t.event_title}
                    </span>
                    <span className="text-xs text-muted">{t.event_date}</span>
                  </div>

                  <h3 className="font-extrabold text-main text-lg leading-snug">{t.name}</h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{t.description}</p>
                </div>

                {/* Squad Members */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                    Squad Members ({t.members.length} / 4)
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {t.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-theme-secondary border border-theme text-xs text-main"
                      >
                        <img src={m.avatar_url} alt={m.name} className="w-5 h-5 rounded-full object-cover" />
                        <span className="font-semibold text-main">{m.name}</span>
                        <span className="text-[10px] text-teal-600 dark:text-teal-300 font-medium">({m.team_role})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Open Positions Needed */}
                <div className="space-y-1.5 pt-2 border-t border-theme">
                  <span className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400 tracking-wider block">
                    Looking For:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {t.required_roles.map((r, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-0.5 rounded-lg bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 font-medium">
                        🔍 {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: INVITATIONS */}
      {activeSubTab === 'invitations' && (
        <div className="space-y-6">
          {/* Received Invites */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-main flex items-center gap-2">
              <span>Invitations Received</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-800">
                {invitations.received.length}
              </span>
            </h2>

            {invitations.received.length === 0 ? (
              <div className="p-8 text-center bg-surface rounded-3xl border border-theme text-xs text-muted shadow-sm">
                No pending invitations received yet.
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.received.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-5 rounded-3xl bg-surface border border-theme flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-main text-base">{inv.team_name}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-500/40 font-medium">
                          Role: {inv.role}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inv.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40' :
                          inv.status === 'rejected' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40' :
                          'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                        }`}>
                          {inv.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        From <strong className="text-main">{inv.sender_name}</strong>: "{inv.message}"
                      </p>
                      <p className="text-[11px] text-muted">For event: {inv.event_title}</p>
                    </div>

                    {inv.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleRespondInvite(inv.id, 'accept')}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept Squad</span>
                        </button>
                        <button
                          onClick={() => handleRespondInvite(inv.id, 'reject')}
                          className="px-4 py-2 rounded-xl bg-theme-secondary hover:bg-rose-50 dark:hover:bg-rose-950 text-muted hover:text-rose-600 dark:hover:text-rose-300 border border-theme hover:border-rose-300 dark:hover:border-rose-800 font-medium text-xs transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent Invites */}
          {invitations.sent.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-theme">
              <h2 className="text-base font-bold text-muted">Sent Invitations</h2>
              <div className="space-y-2">
                {invitations.sent.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-2xl bg-surface border border-theme flex items-center justify-between text-xs text-muted shadow-sm"
                  >
                    <div>
                      Invited <strong className="text-main">{inv.recipient_name}</strong> to join <strong className="text-teal-600 dark:text-teal-300">{inv.team_name}</strong> as {inv.role}
                    </div>
                    <span className="font-semibold text-[11px] text-muted capitalize">{inv.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Squad Modal */}
      {showCreateSquad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-navy-950/80 backdrop-blur-md animate-fade-in">
          <div 
            className="bg-surface border border-theme rounded-3xl max-w-lg w-full shadow-2xl p-6 relative text-main"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCreateSquad(false)}
              className="absolute top-5 right-5 text-muted hover:text-main p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-violet-600 to-teal-400 text-white">
                <Users2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-main">Assemble a Hackathon Squad</h3>
                <p className="text-xs text-muted">Establish your project team and invite complementary builders.</p>
              </div>
            </div>

            <form onSubmit={handleCreateSquad} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Target Hackathon Event</label>
                <select
                  value={squadEventId}
                  onChange={(e) => setSquadEventId(e.target.value)}
                  className="w-full px-3 py-2 bg-theme-secondary border border-theme rounded-xl text-main focus:outline-none focus:border-violet-500"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Squad / Project Name *</label>
                <input
                  type="text"
                  value={squadName}
                  onChange={(e) => setSquadName(e.target.value)}
                  required
                  placeholder="e.g. Agentic Titans"
                  className="w-full px-3 py-2 bg-theme-secondary border border-theme rounded-xl text-main focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Project Concept & Vision *</label>
                <textarea
                  value={squadDesc}
                  onChange={(e) => setSquadDesc(e.target.value)}
                  required
                  rows={3}
                  placeholder="Describe your hackathon problem statement, proposed architecture, and target prize category..."
                  className="w-full px-3 py-2 bg-theme-secondary border border-theme rounded-xl text-main focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Required Roles to Complete Squad (comma separated)</label>
                <input
                  type="text"
                  value={squadRoles}
                  onChange={(e) => setSquadRoles(e.target.value)}
                  placeholder="Backend Developer, AI/ML Engineer, UI/UX Designer"
                  className="w-full px-3 py-2 bg-theme-secondary border border-theme rounded-xl text-main focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-3 border-t border-theme flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateSquad(false)}
                  className="px-4 py-2 rounded-xl bg-theme-secondary hover:bg-slate-200 dark:hover:bg-navy-800 text-muted font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSquad}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white font-bold transition-all shadow-md shadow-violet-900/30 disabled:opacity-50"
                >
                  {submittingSquad ? 'Creating Squad...' : 'Publish Squad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Invitation Modal */}
      {inviteModalCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-navy-950/80 backdrop-blur-md animate-fade-in">
          <div 
            className="bg-surface border border-theme rounded-3xl max-w-md w-full shadow-2xl p-6 relative text-main"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setInviteModalCandidate(null)}
              className="absolute top-5 right-5 text-muted hover:text-main p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img
                src={inviteModalCandidate.avatar_url}
                alt={inviteModalCandidate.name}
                className="w-12 h-12 rounded-2xl object-cover border border-teal-500/40"
              />
              <div>
                <h3 className="text-base font-bold text-main">Invite {inviteModalCandidate.name}</h3>
                <p className="text-xs text-teal-600 dark:text-teal-400">{inviteModalCandidate.role}</p>
              </div>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Select Your Squad</label>
                <select
                  value={inviteTeamId}
                  onChange={(e) => setInviteTeamId(e.target.value)}
                  className="w-full px-3 py-2 bg-theme-secondary border border-theme rounded-xl text-main focus:outline-none focus:border-violet-500"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.event_title})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Invited Role</label>
                <input
                  type="text"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-theme-secondary border border-theme rounded-xl text-main focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Personal Message</label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-theme-secondary border border-theme rounded-xl text-main focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-3 border-t border-theme flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInviteModalCandidate(null)}
                  className="px-4 py-2 rounded-xl bg-theme-secondary hover:bg-slate-200 dark:hover:bg-navy-800 text-muted font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white font-bold transition-all shadow-md shadow-violet-900/30 disabled:opacity-50"
                >
                  {sendingInvite ? 'Sending...' : 'Send Squad Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};