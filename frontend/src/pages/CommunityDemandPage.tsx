import React, { useState, useEffect } from 'react';
import { 
  Users2, 
  Sparkles, 
  ThumbsUp, 
  PlusCircle, 
  MapPin, 
  MessageSquare, 
  CheckCircle2, 
  X, 
  Vote,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { CommunityDemand, UserProfile } from '../types';
import { fetchCommunityDemands, createCommunityDemand, voteCommunityDemand } from '../api';

interface Props {
  currentUser: UserProfile | null;
  showToast: (msg: string, type: 'success' | 'warning' | 'info') => void;
}

export const CommunityDemandPage: React.FC<Props> = ({ currentUser, showToast }) => {
  const [demands, setDemands] = useState<CommunityDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('workshops');
  const [suggestedLocality, setSuggestedLocality] = useState('Indiranagar');
  const [submitting, setSubmitting] = useState(false);

  const loadDemands = async () => {
    setLoading(true);
    try {
      const data = await fetchCommunityDemands(currentUser?.id || 'u-1');
      setDemands(data.demands);
    } catch (err) {
      console.error('Failed to load demands', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDemands();
  }, [currentUser]);

  const handleVote = async (demandId: string) => {
    setVotingId(demandId);
    try {
      const res = await voteCommunityDemand(demandId, currentUser?.id || 'u-1');
      setDemands(prev =>
        prev.map(d =>
          d.id === demandId
            ? { ...d, has_voted: res.has_voted, votes_count: res.votes_count }
            : d
        )
      );
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to vote', 'warning');
    } finally {
      setVotingId(null);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    setSubmitting(true);
    try {
      const res = await createCommunityDemand({
        title,
        description,
        category,
        suggested_locality: suggestedLocality,
      });
      showToast(res.message, 'success');
      setShowSuggestModal(false);
      setTitle('');
      setDescription('');
      loadDemands();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit demand', 'warning');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-theme shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand border border-brand/20 text-xs font-bold">
            <Vote className="w-3.5 h-3.5 text-brand" />
            <span>Crowdsourced Hyperlocal Demand</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-main tracking-tight">
            Community Event Wishlist
          </h1>
          <p className="text-xs sm:text-sm text-secondary max-w-xl">
            Signal demand to local hosts and sponsors. Suggest what topics or formats you want in your neighbourhood and upvote fellow developers' ideas.
          </p>
        </div>

        <button
          onClick={() => setShowSuggestModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-md shadow-brand/20 cursor-pointer active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Suggest an Event</span>
        </button>
      </div>

      {/* Wishlist Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-44 rounded-3xl bg-surface border border-theme animate-pulse shadow-card" />
          ))}
        </div>
      ) : demands.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface border border-theme space-y-3 shadow-card">
          <Vote className="w-10 h-10 text-muted mx-auto" />
          <h3 className="text-base font-bold text-main">No community requests yet</h3>
          <p className="text-xs text-secondary">Be the first to propose an event you want hosted locally!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {demands.map((demand) => (
            <div
              key={demand.id}
              className="p-5 sm:p-6 rounded-3xl bg-surface border border-theme hover:border-brand/40 transition-all flex flex-col justify-between space-y-4 shadow-card hover:shadow-elevated"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-surface-secondary text-secondary border border-theme">
                    {demand.category}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    <span>{demand.suggested_locality}</span>
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-main leading-snug">
                  {demand.title}
                </h3>
                <p className="text-xs text-secondary leading-relaxed font-normal">
                  {demand.description}
                </p>
              </div>

              <div className="pt-3 border-t border-theme flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted">
                  Proposed by <strong className="text-main">{demand.submitter_name}</strong>
                </span>

                <button
                  onClick={() => handleVote(demand.id)}
                  disabled={votingId === demand.id}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    demand.has_voted
                      ? 'bg-brand/10 text-brand border-brand/30 shadow-sm'
                      : 'bg-surface-secondary text-secondary border-theme hover:text-main'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${demand.has_voted ? 'fill-brand text-brand' : ''}`} />
                  <span>{demand.votes_count} Votes</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggest Modal */}
      {showSuggestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
          <div 
            className="bg-surface border border-theme rounded-3xl max-w-lg w-full shadow-elevated p-6 sm:p-7 relative text-main transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSuggestModal(false)}
              className="absolute top-5 right-5 text-muted hover:text-main p-1 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-main mb-1">Suggest a Local Event</h3>
            <p className="text-xs text-secondary mb-4">
              Tell the community what hackathon or masterclass you want organized in Bengaluru.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-main mb-1">Event Concept Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus Workshop"
                  className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-main mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main focus:outline-none focus:border-brand cursor-pointer"
                >
                  <option value="hackathons">Hackathons</option>
                  <option value="workshops">Workshops</option>
                  <option value="tech_meetups">Tech Meetups</option>
                  <option value="coding_contests">Contests</option>
                  <option value="volunteering">Volunteering</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-main mb-1">Target Locality in Bengaluru</label>
                <select
                  value={suggestedLocality}
                  onChange={(e) => setSuggestedLocality(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main focus:outline-none focus:border-brand cursor-pointer"
                >
                  <option value="Koramangala">Koramangala</option>
                  <option value="Indiranagar">Indiranagar</option>
                  <option value="HSR Layout">HSR Layout</option>
                  <option value="Whitefield">Whitefield</option>
                  <option value="Electronic City">Electronic City</option>
                  <option value="Central Bangalore">Central Bangalore</option>
                  <option value="Bellandur">Bellandur</option>
                  <option value="Jayanagar">Jayanagar</option>
                  <option value="Yelahanka">Yelahanka</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-main mb-1">Description & Expected Takeaways *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why is this needed? What hands-on experience or skills should attendees gain?"
                  className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main focus:outline-none focus:border-brand"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSuggestModal(false)}
                  className="px-4 py-2 rounded-xl text-secondary hover:text-main font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold transition-all shadow-md shadow-brand/20 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {submitting ? 'Publishing...' : 'Submit Wishlist Idea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
