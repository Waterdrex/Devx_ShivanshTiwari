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
  QrCode
} from 'lucide-react';
import { EventItem, UserProfile } from '../types';
import { registerForEvent } from '../api';

interface Props {
  event: EventItem | null;
  isOpen: boolean;
  currentUser: UserProfile;
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
    setStep(2); // Go to review step
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

      const ticketData = res.ticket || {
        ticket_code: res.already_registered ? (event.user_ticket_code || 'ES-CONFIRMED') : `ES-${event.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
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
      setStep(3); // Go to final confirmed ticket pass step
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-navy-950/85 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 relative text-slate-900 dark:text-slate-100 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={resetAndClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Multi-Step Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between max-w-xs mx-auto mb-2 text-xs font-bold">
            <span className={step >= 1 ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}>1. Details</span>
            <span className="text-slate-300 dark:text-slate-600">→</span>
            <span className={step >= 2 ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}>2. Review</span>
            <span className="text-slate-300 dark:text-slate-600">→</span>
            <span className={step === 3 ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}>3. Ticket Pass</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-navy-950 rounded-full h-1.5 overflow-hidden border border-slate-200 dark:border-navy-800">
            <div 
              className="h-full bg-gradient-to-r from-violet-600 to-teal-400 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* STEP 1: ATTENDEE FORM */}
        {step === 1 && (
          <div>
            <div className="mb-4">
              <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 tracking-wider">Step 1 of 3</span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">Attendee Registration Details</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                For: <span className="text-slate-800 dark:text-slate-200 font-bold">{event.title}</span>
              </p>
            </div>

            <form onSubmit={handleDetailsSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={attendeeName}
                      onChange={(e) => setAttendeeName(e.target.value)}
                      placeholder="Your name"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={attendeeEmail}
                      onChange={(e) => setAttendeeEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">T-Shirt Size</label>
                  <div className="relative">
                    <Shirt className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <select
                      value={tshirtSize}
                      onChange={(e) => setTshirtSize(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
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
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Dietary Preference</label>
                  <div className="relative">
                    <Utensils className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <select
                      value={dietary}
                      onChange={(e) => setDietary(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
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
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  GitHub / Portfolio / LinkedIn URL
                </label>
                <div className="relative">
                  <ExternalLink className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={githubLinkedin}
                    onChange={(e) => setGithubLinkedin(e.target.value)}
                    placeholder="github.com/yourhandle"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-violet-900/20"
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
            <div className="mb-4">
              <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 tracking-wider">Step 2 of 3</span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Review Registration Summary</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verify details before digital ticket issuance.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-2">
                <div className="font-bold text-sm text-slate-900 dark:text-white">{event.title}</div>
                <div className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-violet-500" />
                  <span>{event.date} • {event.start_time} - {event.end_time}</span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{event.venue}, {event.city}</span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Ticket className="w-3.5 h-3.5 text-teal-500" />
                  <span>Pass Tier: <strong className="text-slate-900 dark:text-white">{event.price_type === 'free' ? 'Complimentary Community Pass' : `Standard ($${event.price})`}</strong></span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400">Attendee Name:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{attendeeName}</div>
                </div>
                <div>
                  <span className="text-slate-400">Email:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{attendeeEmail}</div>
                </div>
                <div>
                  <span className="text-slate-400">T-Shirt & Diet:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">Size {tshirtSize} • {dietary}</div>
                </div>
                <div>
                  <span className="text-slate-400">Portfolio:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{githubLinkedin || 'None'}</div>
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer p-1">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="rounded border-slate-300 dark:border-navy-700 text-violet-600 focus:ring-violet-500 mt-0.5"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  I commit to attending this community event. If I cannot attend, I will cancel via <strong>My Passes</strong> to release capacity for waitlisted developers.
                </span>
              </label>

              <div className="pt-2 flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-semibold"
                >
                  ← Edit Details
                </button>
                <button
                  type="button"
                  disabled={!agreedTerms || loading}
                  onClick={handleConfirmRegistration}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-violet-900/20 disabled:opacity-50"
                >
                  {loading ? 'Securing Seat...' : 'Confirm Free Registration'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: TICKET PASS CONFIRMED */}
        {step === 3 && confirmedTicket && (
          <div className="space-y-4 animate-fade-in text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Registration Confirmed!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your entry badge has been verified in the EventSphere database.
              </p>
            </div>

            {/* Stylized Printable Ticket Pass */}
            <div className="relative p-5 rounded-3xl bg-slate-50 dark:bg-gradient-to-b dark:from-navy-850 dark:to-navy-950 border border-slate-200 dark:border-navy-700 shadow-xl text-left overflow-hidden">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-dashed border-slate-200 dark:border-navy-700">
                <div>
                  <div className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 tracking-wider">Official Event Pass</div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{confirmedTicket.event_title}</h4>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shrink-0">
                  <QrCode className="w-8 h-8 text-slate-700 dark:text-slate-300" />
                </div>
              </div>

              <div className="py-3 grid grid-cols-2 gap-3 text-xs border-b border-dashed border-slate-200 dark:border-navy-700">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Attendee</span>
                  <div className="font-bold text-slate-900 dark:text-white">{confirmedTicket.attendee_name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{confirmedTicket.attendee_email}</div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Ticket Pass Code</span>
                  <div className="font-mono font-bold text-violet-600 dark:text-violet-400 text-sm tracking-wide">
                    {confirmedTicket.ticket_code}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Date & Time</span>
                  <div className="font-semibold text-slate-700 dark:text-slate-300">{confirmedTicket.date}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{confirmedTicket.time} IST</div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Venue</span>
                  <div className="font-semibold text-slate-700 dark:text-slate-300 truncate">{confirmedTicket.venue}</div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span>Verified by EventSphere Security</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">STATUS: CONFIRMED</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-navy-700 transition-colors"
              >
                Print / Save Pass
              </button>

              <button
                type="button"
                onClick={() => {
                  resetAndClose();
                  if (onNavigateToMyEvents) onNavigateToMyEvents();
                }}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-violet-900/20"
              >
                View in My Passes →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
