import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { TrustScore } from '../types';

interface Props {
  trust?: TrustScore;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const TrustScoreBadge: React.FC<Props> = ({ trust, onClick, size = 'md' }) => {
  if (!trust) return null;

  const score = trust.score;
  const isDup = trust.is_duplicate_flagged;

  let colorClasses = 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 hover:border-emerald-500';
  let Icon = ShieldCheck;
  let text = 'Verified';

  if (isDup || score < 65) {
    colorClasses = 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/40 hover:border-rose-500';
    Icon = ShieldAlert;
    text = isDup ? 'Duplicate Flag' : 'Needs Review';
  } else if (score < 85) {
    colorClasses = 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40 hover:border-amber-500';
    Icon = AlertTriangle;
    text = 'Community';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`inline-flex items-center rounded-full border backdrop-blur-md transition-all duration-200 cursor-pointer shadow-sm active:scale-95 ${colorClasses} ${sizeClasses[size]}`}
      title="Click to view explainable trust intelligence breakdown"
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span className="font-bold">{score}</span>
      <span className="opacity-80 text-[10px] font-semibold">{text}</span>
    </button>
  );
};
