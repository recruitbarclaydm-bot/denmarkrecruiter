'use client';

import React, { useState } from 'react';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useToast } from '@/context/ToastContext';
import { X, UserPlus, CheckCircle, ShieldCheck } from 'lucide-react';
import { SchemeType } from '@/types';

interface ManualRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualRegisterModal: React.FC<ManualRegisterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { registerCandidate, approveAccount } = usePortalStore();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Denmark@2026');
  const [passportNumber, setPassportNumber] = useState('');
  const [dob, setDob] = useState('1994-05-15');
  const [passportExpiry, setPassportExpiry] = useState('2034-05-15');
  const [nationality, setNationality] = useState('Nepal');
  const [phone, setPhone] = useState('+977-9800000000');
  const [permanentAddress, setPermanentAddress] = useState('Kathmandu, Nepal');
  const [scheme, setScheme] = useState<SchemeType>('seasonal_agriculture');
  const [sponsorCode, setSponsorCode] = useState('#944135');
  const [cvrNumber, setCvrNumber] = useState('38291044');
  const [autoApprove, setAutoApprove] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !passportNumber.trim()) {
      showToast('Name, Email, and Passport Number are required.', 'error');
      return;
    }

    try {
      const newCandidate = await registerCandidate({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        passportNumber: passportNumber.trim().toUpperCase(),
        dob,
        passportExpiry,
        nationality,
        phone,
        permanentAddress,
        scheme,
        sponsorCode: sponsorCode.trim(),
        cvrNumber: cvrNumber.trim(),
      }, true);

      if (autoApprove) {
        approveAccount(
          newCandidate.id,
          sponsorCode.trim(),
          `SB6-${Math.floor(100000 + Math.random() * 900000)}-2026`,
          'Caseworker Manual Onboarding'
        );
      }

      showToast(`Registered and onboarded candidate ${newCandidate.name} successfully.`, 'success');
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to create candidate account.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-brand-primary dark:text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Register New Candidate Profile
              </h2>
              <p className="text-xs text-slate-500">
                SIRI Direct Administrative Onboarding Desk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Bikash Thapa"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address (Login ID) *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@example.com"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Candidate Password *
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
            </div>

            {/* Passport */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Passport Number *
              </label>
              <input
                type="text"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                placeholder="PA1234567"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-brand-primary focus:outline-none uppercase"
              />
            </div>

            {/* Scheme */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Immigration Scheme *
              </label>
              <select
                value={scheme}
                onChange={(e) => setScheme(e.target.value as SchemeType)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
              >
                <option value="seasonal_agriculture">Denmark Seasonal Agricultural Scheme</option>
                <option value="siri_herdsman">Herdsmen &amp; Farm Managers Scheme</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
            </div>

            {/* Sponsor Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sponsor Code
              </label>
              <input
                type="text"
                value={sponsorCode}
                onChange={(e) => setSponsorCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
            </div>

            {/* CVR */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Employer CVR
              </label>
              <input
                type="text"
                value={cvrNumber}
                onChange={(e) => setCvrNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Permanent Address
            </label>
            <input
              type="text"
              value={permanentAddress}
              onChange={(e) => setPermanentAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>

          {/* Auto-Approve Checkbox */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5">
            <input
              type="checkbox"
              id="autoApprove"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="rounded border-emerald-400 text-brand-primary focus:ring-brand-primary cursor-pointer"
            />
            <label htmlFor="autoApprove" className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 cursor-pointer">
              Auto-approve candidate account &amp; unlock portal immediately (Bypass pending queue)
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-lg bg-brand-primary hover:bg-brand-secondary text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Create Candidate Dossier</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
