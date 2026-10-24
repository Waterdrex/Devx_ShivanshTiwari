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
  Vote 
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
    <div className="space-y-6 pb-16 animate-fade-in">
      
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20 text-xs font-bold">
            <Vote className="w-3.5 h-3.5 text-rose-500" />
            <span>Crowdsourced Hyperlocal Demand</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Community Event Wishlist
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
            Signal demand to local hosts and sponsors. Suggest what topics or formats you want in your neighbourhood and upvote fellow developers' ideas.
          </p>
        </div>

        <button
          onClick={() => setShowSuggestModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-teal-500 text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-violet-900/20 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Suggest an Event</span>
        </button>
      </div>

      {/* Wishlist Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-44 rounded-3xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 animate-pulse" />
          ))}
        </div>
      ) : demands.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-800 space-y-3 shadow-sm">
          <Vote className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No community requests yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Be the first to propose an event you want hosted locally!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demands.map((demand) => (
            <div
              key={demand.id}
              className="p-5 rounded-3xl bg-white dark:bg-navy-900/90 border border-slate-200 dark:border-navy-800 hover:border-violet-500/40 transition-all flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                    {demand.category}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    <span>{demand.suggested_locality}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{demand.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{demand.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  Proposed by <strong className="text-slate-700 dark:text-slate-300">{demand.submitter_name}</strong>
                </span>

                <button
                  onClick={() => handleVote(demand.id)}
                  disabled={votingId === demand.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    demand.has_voted
                      ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/40 shadow-sm'
                      : 'bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-700 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${demand.has_voted ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{demand.votes_count} Votes</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggest Modal */}
      {showSuggestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-navy-950/85 backdrop-blur-md animate-fade-in">
          <div 
            className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-3xl max-w-lg w-full shadow-2xl p-6 relative text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSuggestModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Suggest a Local Event</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Tell the community what hackathon or meetup you want organized in Bengaluru.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Event Concept Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed LLM Inference Hackathon"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 font-medium"
                  >
                    <option value="hackathons">Hackathon</option>
                    <option value="workshops">Hands-on Workshop</option>
                    <option value="tech_meetups">Tech Meetup</option>
                    <option value="coding_contests">Coding Contest</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Suggested Locality</label>
                  <select
                    value={suggestedLocality}
                    onChange={(e) => setSuggestedLocality(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 font-medium"
                  >
                    <option value="Indiranagar">Indiranagar</option>
                    <option value="Koramangala">Koramangala</option>
                    <option value="HSR Layout">HSR Layout</option>
                    <option value="Whitefield">Whitefield</option>
                    <option value="Electronic City">Electronic City</option>
                    <option value="Bellandur">Bellandur</option>
                    <option value="Central Bangalore">Central Bangalore</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Description & Target Audience *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why is this event needed? What tech stack should it focus on?"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSuggestModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-violet-900/20 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Post to Community Wishlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
