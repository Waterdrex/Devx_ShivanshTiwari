import React from 'react';
import { X, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Info, Sparkles } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-surface border border-theme rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-elevated p-6 sm:p-7 relative text-main transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Screen 12) */}
        <div className="flex items-start justify-between pb-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border ${
              score >= 85 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
              score >= 65 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' :
              'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
            }`}>
              {score >= 85 ? <ShieldCheck className="w-7 h-7" /> : score >= 65 ? <AlertTriangle className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold tracking-tight text-main">Trust Intelligence</h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 font-bold">
                  7-Signal Audit
                </span>
              </div>
              <p className="text-xs text-secondary mt-0.5 truncate max-w-xs sm:max-w-md">
                Audited Event: <span className="text-main font-bold">{eventTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-main p-1.5 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Hero Summary */}
        <div className="my-5 p-5 rounded-2xl bg-surface-secondary border border-theme flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Overall Trust Index</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-4xl font-black ${
                score >= 85 ? 'text-emerald-600 dark:text-emerald-400' : score >= 65 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {score}
              </span>
              <span className="text-muted text-sm font-medium">/ 100</span>
              <span className={`ml-2 text-xs font-bold px-2.5 py-1 rounded-full ${
                score >= 85 ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                score >= 65 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' :
                'bg-rose-500/20 text-rose-700 dark:text-rose-300'
              }`}>
                {trust.tier}
              </span>
            </div>
            <p className="text-xs text-secondary mt-1">
              Organizer: <span className="text-main font-bold">{organizerName}</span>
            </p>
          </div>

          <div className="w-32 text-right">
            <div className="text-xs text-muted mb-1 font-semibold">Authenticity</div>
            <div className="w-full bg-theme rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  score >= 85 ? 'bg-emerald-500' :
                  score >= 65 ? 'bg-amber-500' :
                  'bg-rose-500'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Duplicate Warning Callout if flagged */}
        {isDup && trust.duplicate_info && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Duplicate or Mirror Listing Detected</span>
            </div>
            <p className="text-secondary leading-relaxed">
              {trust.duplicate_info.reason}
            </p>
            <div className="text-[11px] text-rose-700 dark:text-rose-300 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20 font-mono">
              Similarity Score: {trust.duplicate_info.similarity}% • Matched ID: #{trust.duplicate_info.duplicate_event_id}
            </div>
          </div>
        )}

        {/* 7-Signal Breakdown List (Screen 12) */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-wider font-bold text-muted flex items-center justify-between">
            <span>7 Verified Signals Breakdown</span>
            <span>Weight / Score</span>
          </h4>

          <div className="divide-y divide-theme border border-theme rounded-2xl overflow-hidden bg-surface-secondary/50">
            {trust.signals.map((sig, idx) => (
              <div key={idx} className="p-3.5 hover:bg-surface-secondary transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {sig.status === 'passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : sig.status === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span className="font-bold text-sm text-main">{sig.name}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${
                    sig.score > 0 ? 'text-emerald-600 dark:text-emerald-400' : sig.score < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted'
                  }`}>
                    {sig.score > 0 ? `+${sig.score}` : sig.score} / {sig.max > 0 ? `+${sig.max}` : 0}
                  </span>
                </div>
                <p className="text-xs text-secondary ml-6 leading-relaxed">
                  {sig.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Transparency note */}
        <div className="mt-5 p-3.5 rounded-2xl bg-surface-secondary border border-theme flex items-start gap-2.5 text-xs text-secondary">
          <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-main">Deterministic Verification: </span>
            {trust.demo_disclaimer} Every score signal is computed deterministically from real-time host validation, venue geocoding, and listing text similarity.
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-surface-secondary hover:bg-surface text-main text-xs font-bold border border-theme transition-colors cursor-pointer"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
