'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useToast } from '@/context/ToastContext';
import { Header } from '@/components/shared/Header';
import {
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Upload,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export default function CandidateRegisterPage() {
  const router = useRouter();
  const portalStore = usePortalStore();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  // Step 1
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+977-');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');

  // Step 2
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');
  const [scheme, setScheme] = useState<'siri_herdsman' | 'seasonal_agriculture'>('siri_herdsman');
  const [workExperience, setWorkExperience] = useState('');

  // Step 3 (Files)
  const [passportScanName, setPassportScanName] = useState('');
  const [passportScanData, setPassportScanData] = useState<string | undefined>(undefined);

  const [citizenshipName, setCitizenshipName] = useState('');
  const [citizenshipData, setCitizenshipData] = useState<string | undefined>(undefined);

  const [cvName, setCvName] = useState('');
  const [cvData, setCvData] = useState<string | undefined>(undefined);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setterName: (name: string) => void,
    setterData: (data: string | undefined) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be under 10MB.', 'error');
      return;
    }

    setterName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setterData(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 1) {
      if (!fullName || !email || !password || !phone || !dob || !address) {
        showToast('Please complete all personal and account fields.', 'error');
        return;
      }
      if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
      }
      // Check if email already registered
      const existing = portalStore.getCandidateByEmail(email);
      if (existing) {
        showToast('An account with this email address already exists. Please log in.', 'error');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!passportNumber || !passportExpiry) {
        showToast('Please complete passport details.', 'error');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passportScanData) {
      showToast('Passport Bio-Page Scan is required for verification.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await portalStore.registerCandidate({
        name: fullName,
        email,
        password,
        phone,
        dob,
        permanentAddress: address,
        passportNumber,
        passportExpiry,
        scheme,
        workExperienceSummary: workExperience,
        initialDocName: passportScanName,
        passportScanData,
        citizenshipScanData: citizenshipData,
        cvData,
      });

      showToast('Registration submitted successfully! Dossier is under review.', 'success');
      router.push('/pending-approval');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error during registration. Please check your data.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 transition-colors">
      <Header hidePrint />

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 my-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
          {/* Header & Steps Tracker */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-brand-primary dark:text-emerald-400 flex items-center justify-center shadow-inner mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Apply for Danish Immigration Dossier
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Official Danish Agency for International Recruitment and Integration (SIRI) Candidate Portal
            </p>

            {/* Stepper Wizard Indicator */}
            <div className="flex items-center justify-center gap-3 sm:gap-6 mt-6">
              {[
                { num: 1, label: 'Account & Personal' },
                { num: 2, label: 'Passport & Scheme' },
                { num: 3, label: 'Initial Documents' },
              ].map((step) => (
                <div key={step.num} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      currentStep === step.num
                        ? 'bg-brand-primary text-white shadow-md ring-2 ring-emerald-300'
                        : currentStep > step.num
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {currentStep > step.num ? '✓' : step.num}
                  </div>
                  <span
                    className={`text-[11px] font-semibold hidden sm:inline ${
                      currentStep === step.num
                        ? 'text-brand-primary dark:text-emerald-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Account & Personal */}
          {currentStep === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Full Legal Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ram Bahadur Thapa"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Security Password (min. 6 characters) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create security password"
                      required
                      minLength={6}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Phone Number (with Country Code) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+977-9800000000"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Date of Birth *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      placeholder="e.g. 15 March 1990"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Permanent Address in Nepal *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Pokhara-8, Kaski, Nepal"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <Link href="/" className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                  &larr; Back to Login
                </Link>
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-2"
                >
                  <span>Continue to Step 2</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Passport & Scheme */}
          {currentStep === 2 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Passport Number *
                  </label>
                  <input
                    type="text"
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. PA0192834"
                    required
                    className="w-full px-3 py-2 text-xs uppercase font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Passport Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={passportExpiry}
                    onChange={(e) => setPassportExpiry(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Selected Danish Work &amp; Residence Scheme *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setScheme('siri_herdsman')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      scheme === 'siri_herdsman'
                        ? 'border-brand-primary bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-brand-primary'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      Herdsmen &amp; Farm Managers (§9a)
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Statutory salary standard DKK 35,705/mo &middot; 3F/GLA collective agreement &middot; 24 Months
                    </div>
                  </div>

                  <div
                    onClick={() => setScheme('seasonal_agriculture')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      scheme === 'seasonal_agriculture'
                        ? 'border-brand-primary bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-brand-primary'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      Seasonal Agricultural Worker Scheme
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Horticulture &amp; field harvest &middot; Sponsored visa processing &middot; Fixed duration
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Agricultural &amp; Livestock Work Experience Summary
                </label>
                <textarea
                  value={workExperience}
                  onChange={(e) => setWorkExperience(e.target.value)}
                  rows={3}
                  placeholder="Summarize your practical farm, livestock, or agricultural machinery experience..."
                  className="w-full p-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="py-2.5 px-4 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-2"
                >
                  <span>Continue to Uploads</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Initial Uploads */}
          {currentStep === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-5">
              {/* Passport Bio-Page Upload */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-primary" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      1. Passport Bio-Data Page Scan *
                    </span>
                  </div>
                  {passportScanData && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Attached
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Clear, full color scan of the photo &amp; MRZ code page (PDF or JPG, max 10MB).
                </p>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg"
                  onChange={(e) => handleFileUpload(e, setPassportScanName, setPassportScanData)}
                  className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                />
                {passportScanName && (
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">{passportScanName}</div>
                )}
              </div>

              {/* Citizenship / National ID Upload */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      2. Citizenship Certificate / National ID
                    </span>
                  </div>
                  {citizenshipData && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Attached
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Front and back scan of your Nepali Nagarikta certificate.
                </p>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg"
                  onChange={(e) => handleFileUpload(e, setCitizenshipName, setCitizenshipData)}
                  className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer"
                />
                {citizenshipName && (
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">{citizenshipName}</div>
                )}
              </div>

              {/* CV / Working Cert Upload */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      3. Europass CV or Agricultural Certificate
                    </span>
                  </div>
                  {cvData && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Attached
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Attach your resume or past farm experience certification (optional at signup).
                </p>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg"
                  onChange={(e) => handleFileUpload(e, setCvName, setCvData)}
                  className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-800 hover:file:bg-purple-200 cursor-pointer"
                />
                {cvName && <div className="text-[10px] text-slate-500 mt-1 font-mono">{cvName}</div>}
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="py-2.5 px-4 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-3 px-8 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-lg shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Registering Dossier...' : 'Submit Registration Dossier'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800">
        &copy; {new Date().getFullYear()} Danish Agency for International Recruitment and Integration (SIRI). All rights reserved.
      </footer>
    </div>
  );
}
