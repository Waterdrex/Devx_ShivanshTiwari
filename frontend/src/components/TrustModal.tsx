import React from 'react';
import { X, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { TrustScore } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trust?: TrustScore;
  eventTitle: string;
  organizerName: string;
}

export const TrustModal: React.FC<Props> = ({
  isOpen,
  onClose,
  trust,
  eventTitle,
  organizerName,
}) => {
  if (!isOpen || !trust) return null;

  const score = trust.score;
  const isDup = trust.is_duplicate_flagged;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-navy-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative text-slate-900 dark:text-slate-100 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${
              score >= 85 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' :
              score >= 65 ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' :
              'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
            }`}>
              {score >= 85 ? <ShieldCheck className="w-7 h-7" /> : score >= 65 ? <AlertTriangle className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Trust Intelligence Score</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 font-semibold">
                  Explainable KYC
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                For: <span className="text-slate-800 dark:text-slate-200 font-semibold">{eventTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Hero Summary */}
        <div className="my-5 p-4 rounded-2xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-navy-800 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Overall Rating</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-4xl font-extrabold ${
                score >= 85 ? 'text-emerald-600 dark:text-emerald-400' : score >= 65 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {score}
              </span>
              <span className="text-slate-400 dark:text-slate-500 text-sm font-medium">/ 100</span>
              <span className={`ml-2 text-xs font-bold px-2.5 py-1 rounded-full ${
                score >= 85 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300' :
                score >= 65 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300' :
                'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'
              }`}>
                {trust.tier}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Hosted by <span className="text-slate-800 dark:text-slate-200 font-semibold">{organizerName}</span>
            </p>
          </div>

          <div className="w-28 text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Authenticity</div>
            <div className="w-full bg-slate-200 dark:bg-navy-950 rounded-full h-2.5 overflow-hidden border border-slate-300 dark:border-navy-700">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  score >= 85 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                  score >= 65 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                  'bg-gradient-to-r from-rose-600 to-red-400'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Duplicate Warning Callout if flagged */}
        {isDup && trust.duplicate_info && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-600/40 text-rose-800 dark:text-rose-200 text-xs">
            <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300 mb-1">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Duplicate or Mirror Listing Alert
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
              {trust.duplicate_info.reason}
            </p>
            <div className="text-[11px] text-rose-700 dark:text-rose-300/80 bg-rose-100 dark:bg-rose-900/30 p-2 rounded-xl border border-rose-200 dark:border-rose-800/40 font-mono">
              Matched Event ID: #{trust.duplicate_info.duplicate_event_id} • Lexical Similarity: {trust.duplicate_info.similarity}%
            </div>
          </div>
        )}

        {/* Explainable Signals Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Verified Signal Breakdown</span>
            <span>Earned / Max</span>
          </h4>

          <div className="divide-y divide-slate-100 dark:divide-navy-800/80 border border-slate-200 dark:border-navy-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-navy-950/40">
            {trust.signals.map((sig, idx) => (
              <div key={idx} className="p-3.5 hover:bg-slate-100/60 dark:hover:bg-navy-800/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {sig.status === 'passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : sig.status === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{sig.name}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${
                    sig.score > 0 ? 'text-emerald-600 dark:text-emerald-400' : sig.score < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {sig.score > 0 ? `+${sig.score}` : sig.score} / {sig.max > 0 ? `+${sig.max}` : 0}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 ml-6 leading-relaxed">
                  {sig.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Mode & Explainability Footer */}
        <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800/80 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-300">Auditable Transparency: </span>
            {trust.demo_disclaimer} Every score factor is computed deterministically from real-time organizer credentials, venue data, and listing text embeddings.
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
