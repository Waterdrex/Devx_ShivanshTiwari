import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { reportEvent } from '../api';

interface Props {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onReportSuccess: (message: string) => void;
}

export const ReportModal: React.FC<Props> = ({
  eventId,
  eventTitle,
  isOpen,
  onClose,
  onReportSuccess,
}) => {
  const [reason, setReason] = useState('duplicate');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      setError('Please provide specific details explaining your concern.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await reportEvent(eventId, { reason, details });
      onReportSuccess(res.message);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-surface border border-theme rounded-3xl max-w-lg w-full shadow-elevated p-6 sm:p-7 relative text-main transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted hover:text-main p-1 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-main leading-tight">
              Report Community Event
            </h3>
            <p className="text-xs text-secondary mt-0.5 truncate max-w-xs">
              For: <span className="text-main font-bold">{eventTitle}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-main mb-1">
              Select Violation Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="duplicate">Suspected Clone or Duplicate Listing</option>
              <option value="scam_fees">Unverified Scam / Demanding Suspicious Fees</option>
              <option value="wrong_venue">Misrepresented Venue / Non-Existent Address</option>
              <option value="safety_issue">Community Conduct / Code of Safety Violation</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-main mb-1">
              Details & Context *
            </label>
            <textarea
              required
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please explain why you believe this event is a duplicate, unauthorized mirror, or policy violation..."
              className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main placeholder-muted focus:outline-none focus:border-brand"
            />
          </div>

          <p className="text-[11px] text-secondary leading-relaxed">
            Reports enter the <strong>Admin Moderation Queue</strong> for manual inspection. Legitimate organizers are protected against false flags by verified host credentials.
          </p>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-secondary hover:text-main font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-md shadow-rose-900/20 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {submitting ? 'Submitting Report...' : 'Submit to Moderation Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
