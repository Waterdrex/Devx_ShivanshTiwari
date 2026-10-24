import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  MapPin, 
  Clock, 
  Ticket, 
  User, 
  Mail, 
  Phone, 
  Shirt, 
  Utensils, 
  ExternalLink, 
  ShieldCheck, 
  QrCode,
  Download,
  CalendarPlus
} from 'lucide-react';
import { EventItem, UserProfile } from '../types';
import { registerForEvent } from '../api';

interface Props {
  event: EventItem | null;
  isOpen: boolean;
  currentUser: UserProfile | null;
  onClose: () => void;
  onRegistrationSuccess: (ticketInfo: any) => void;
  onNavigateToMyEvents?: () => void;
}

export const RegistrationModal: React.FC<Props> = ({
  event,
  isOpen,
  currentUser,
  onClose,
  onRegistrationSuccess,
  onNavigateToMyEvents
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [attendeeName, setAttendeeName] = useState(currentUser?.name || 'Aarav Sharma');
  const [attendeeEmail, setAttendeeEmail] = useState(currentUser?.email || 'aarav.sharma@demo.eventsphere.io');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [tshirtSize, setTshirtSize] = useState('M');
  const [dietary, setDietary] = useState('None');
  const [githubLinkedin, setGithubLinkedin] = useState(currentUser?.github || 'github.com/aaravsharma');
  const [agreedTerms, setAgreedTerms] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedTicket, setConfirmedTicket] = useState<any>(null);

  if (!isOpen || !event) return null;

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendeeName || !attendeeEmail) {
      setError('Please provide your name and email address.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleConfirmRegistration = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await registerForEvent(event.id, {
        user_id: currentUser?.id || 'u-1',
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        phone,
        tshirt_size: tshirtSize,
        dietary,
        github_linkedin: githubLinkedin
      });

      const uniqueCode = `ES-${event.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)}-${Math.floor(100000 + Math.random() * 900000)}`;
      const ticketData = res.ticket || {
        ticket_code: res.already_registered ? (event.user_ticket_code || 'ES-CONFIRMED-884920') : uniqueCode,
        event_title: event.title,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        date: event.date,
        time: `${event.start_time} - ${event.end_time}`,
        venue: `${event.venue}, ${event.city}`,
        status: 'confirmed'
      };

      setConfirmedTicket(ticketData);
      onRegistrationSuccess(ticketData);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setConfirmedTicket(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-surface border border-theme rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-elevated p-6 sm:p-8 relative text-main transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={resetAndClose}
          className="absolute top-5 right-5 text-muted hover:text-main p-1 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Stepper Header (Screen 6) */}
        <div className="mb-6 space-y-2.5">
          <div className="flex items-center justify-between max-w-xs mx-auto text-xs font-bold">
            <span className={step >= 1 ? 'text-brand' : 'text-muted'}>1. Details</span>
            <span className="text-muted">→</span>
            <span className={step >= 2 ? 'text-brand' : 'text-muted'}>2. Review</span>
            <span className="text-muted">→</span>
            <span className={step === 3 ? 'text-brand' : 'text-muted'}>3. Pass Issued</span>
          </div>
          <div className="w-full bg-surface-secondary rounded-full h-1.5 overflow-hidden border border-theme">
            <div 
              className="h-full bg-brand transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* STEP 1: ATTENDEE FORM */}
        {step === 1 && (
          <div>
            <div className="mb-5">
              <span className="text-[10px] uppercase font-bold text-brand tracking-wider">Step 1 of 3</span>
              <h3 className="text-xl font-extrabold text-main leading-snug">Attendee Registration</h3>
              <p className="text-xs text-secondary mt-0.5">
                Registering for: <span className="text-main font-bold">{event.title}</span>
              </p>
            </div>

            <form onSubmit={handleDetailsSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-main mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={attendeeName}
                      onChange={(e) => setAttendeeName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-main mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={attendeeEmail}
                      onChange={(e) => setAttendeeEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-main mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-main mb-1">T-Shirt Size</label>
                  <div className="relative">
                    <Shirt className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                    <select
                      value={tshirtSize}
                      onChange={(e) => setTshirtSize(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main focus:outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="S">Small (S)</option>
                      <option value="M">Medium (M)</option>
                      <option value="L">Large (L)</option>
                      <option value="XL">Extra Large (XL)</option>
                      <option value="2XL">Double XL (2XL)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-main mb-1">Meal Preference</label>
                  <div className="relative">
                    <Utensils className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                    <select
                      value={dietary}
                      onChange={(e) => setDietary(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main focus:outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="None">Standard / Any</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                      <option value="Jain">Jain Friendly</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-main mb-1">
                  GitHub / Portfolio / LinkedIn
                </label>
                <div className="relative">
                  <ExternalLink className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={githubLinkedin}
                    onChange={(e) => setGithubLinkedin(e.target.value)}
                    placeholder="github.com/yourhandle"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-theme text-main focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-theme">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-4 py-2 rounded-xl text-secondary hover:text-main font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold transition-all shadow-md shadow-brand/20 cursor-pointer active:scale-95"
                >
                  <span>Review Pass Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: REVIEW & CONFIRM */}
        {step === 2 && (
          <div>
            <div className="mb-5">
              <span className="text-[10px] uppercase font-bold text-brand tracking-wider">Step 2 of 3</span>
              <h3 className="text-xl font-extrabold text-main">Review Pass Order</h3>
              <p className="text-xs text-secondary mt-0.5">
                Verify details before digital ticket generation.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-surface-secondary border border-theme space-y-2">
                <div className="font-bold text-sm text-main">{event.title}</div>
                <div className="text-secondary flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-brand" />
                  <span>{event.date} • {event.start_time} - {event.end_time} IST</span>
                </div>
                <div className="text-secondary flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{event.venue}, {event.city}</span>
                </div>
                <div className="text-secondary flex items-center gap-2">
                  <Ticket className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    Pass Tier: <strong className="text-main">{event.price_type === 'free' ? 'Complimentary Community Pass' : `Standard (₹${event.price})`}</strong>
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-secondary border border-theme grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-muted">Attendee:</span>
                  <div className="font-bold text-main">{attendeeName}</div>
                </div>
                <div>
                  <span className="text-muted">Email:</span>
                  <div className="font-bold text-main truncate">{attendeeEmail}</div>
                </div>
                <div>
                  <span className="text-muted">T-Shirt & Diet:</span>
                  <div className="font-bold text-main">Size {tshirtSize} • {dietary}</div>
                </div>
                <div>
                  <span className="text-muted">Portfolio:</span>
                  <div className="font-bold text-main truncate">{githubLinkedin || 'None'}</div>
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer p-1">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="rounded border-theme text-brand focus:ring-brand mt-0.5 cursor-pointer"
                />
                <span className="text-[11px] text-secondary leading-tight">
                  I commit to attending this community event. If unable to attend, I will cancel via <strong>My Passes</strong> to release capacity for waitlisted developers.
                </span>
              </label>

              <div className="pt-3 flex justify-between gap-2 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-secondary hover:text-main font-semibold cursor-pointer"
                >
                  ← Edit Details
                </button>
                <button
                  type="button"
                  disabled={!agreedTerms || loading}
                  onClick={handleConfirmRegistration}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold transition-all shadow-md shadow-brand/20 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {loading ? 'Securing Seat...' : 'Confirm Free Registration'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: TICKET PASS CONFIRMED (Screen 7) */}
        {step === 3 && confirmedTicket && (
          <div className="space-y-5 animate-fade-in text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-main">Registration Confirmed!</h3>
              <p className="text-xs text-secondary mt-1">
                Your digital entry badge has been recorded in the EventSphere ledger.
              </p>
            </div>

            {/* Stylized Perforated Ticket Card (Screen 7) */}
            <div className="relative rounded-3xl bg-surface-secondary border border-theme shadow-card text-left overflow-hidden">
              {/* Left & Right Notch Cutouts for ticket perforated look */}
              <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 rounded-full bg-surface border border-theme" />
              <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-surface border border-theme" />

              {/* Pass Top header */}
              <div className="p-5 border-b border-dashed border-theme flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-brand tracking-wider">
                    Official Event Pass
                  </div>
                  <h4 className="text-base font-extrabold text-main leading-snug">
                    {confirmedTicket.event_title}
                  </h4>
                </div>
                <div className="p-2.5 rounded-2xl bg-surface border border-theme shadow-inner shrink-0">
                  <QrCode className="w-9 h-9 text-brand" />
                </div>
              </div>

              {/* Pass Details Grid */}
              <div className="p-5 grid grid-cols-2 gap-4 text-xs border-b border-dashed border-theme">
                <div>
                  <span className="text-[10px] text-muted uppercase font-bold">Attendee</span>
                  <div className="font-extrabold text-main mt-0.5">{confirmedTicket.attendee_name}</div>
                  <div className="text-[10px] text-secondary truncate">{confirmedTicket.attendee_email}</div>
                </div>

                <div>
                  <span className="text-[10px] text-muted uppercase font-bold">Ticket Pass Code</span>
                  <div className="font-mono font-black text-brand text-sm mt-0.5 tracking-wider">
                    {confirmedTicket.ticket_code}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-muted uppercase font-bold">Date & Time</span>
                  <div className="font-semibold text-main mt-0.5">{confirmedTicket.date}</div>
                  <div className="text-[10px] text-secondary">{confirmedTicket.time}</div>
                </div>

                <div>
                  <span className="text-[10px] text-muted uppercase font-bold">Venue</span>
                  <div className="font-semibold text-main mt-0.5 truncate">{confirmedTicket.venue}</div>
                </div>
              </div>

              {/* Security Footer */}
              <div className="px-5 py-3 bg-surface/50 flex items-center justify-between text-[10px] text-muted font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified by EventSphere Security</span>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                  CONFIRMED
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-3 rounded-xl bg-surface hover:bg-surface-secondary text-secondary hover:text-main text-xs font-bold border border-theme transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Ticket</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetAndClose();
                  if (onNavigateToMyEvents) onNavigateToMyEvents();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-md shadow-brand/20 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>View in My Passes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
