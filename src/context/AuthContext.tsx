'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, CandidateRecord, StageNumber, DocumentStatus, DocumentRecord, Role, AccountStatus } from '@/types';
import { usePortalStore } from './PortalStoreContext';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  isAuthInitialized: boolean;
  candidate: CandidateRecord | null;
  allCandidates: CandidateRecord[];
  login: (
    email: string,
    pass: string,
    roleRestriction?: Role
  ) => Promise<{ success: boolean; role?: Role; accountStatus?: AccountStatus; errorReason?: string }>;
  logout: () => void;
  selectCandidate: (id: string) => void;
  advanceCandidateStage: (candidateId: string) => void;
  rollbackCandidateStage: (candidateId: string) => void;
  setCandidateStage: (candidateId: string, stage: StageNumber) => void;
  updateDocumentStatus: (candidateId: string, docId: string, status: DocumentStatus, notes?: string) => void;
  addCandidateDocument: (candidateId: string, doc: DocumentRecord) => void;
  saveCandidateSignature: (candidateId: string, signatureDataUrl: string) => void;
  toggleChecklistItem: (candidateId: string, checkId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const portalStore = usePortalStore();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  useEffect(() => {
    const loadProfile = async (authUserId: string) => {
      const { data, error } = await supabase.from('candidates').select('*').eq('id', authUserId).maybeSingle();
      if (error || !data) {
        setUser(null);
        setIsAuthInitialized(true);
        return;
      }
      const nextUser: User = {
        id: data.id,
        email: data.email,
        name: data.full_name,
        role: data.role,
        candidateId: data.role === 'candidate' ? data.id : undefined,
        department: data.role === 'admin' ? 'SIRI Caseworker Division' : undefined,
      };
      setUser(nextUser);
      setIsAuthInitialized(true);
      if (nextUser.candidateId) portalStore.selectCandidate(nextUser.candidateId);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user.id) void loadProfile(data.session.user.id);
      else {
        setUser(null);
        setIsAuthInitialized(true);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => {
        if (session?.user.id) void loadProfile(session.user.id);
        else {
          setUser(null);
          setIsAuthInitialized(true);
        }
      });
    });
    return () => subscription.unsubscribe();
  }, [portalStore.selectCandidate]);

  const login = async (
    email: string,
    pass: string,
    roleRestriction?: Role
  ): Promise<{ success: boolean; role?: Role; accountStatus?: AccountStatus; errorReason?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: pass });
    if (authError || !authData.user) {
      return { success: false, errorReason: 'Invalid credentials. Please verify your email and password.' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();
    if (profileError || !profile || (profile.role !== 'candidate' && profile.role !== 'admin')) {
      await supabase.auth.signOut();
      return { success: false, errorReason: 'Unable to verify this account profile.' };
    }

    if (roleRestriction && profile.role !== roleRestriction) {
      await supabase.auth.signOut();
      const errorReason = profile.role === 'admin'
        ? 'Administrative staff must sign in via the authorized Caseworker gateway.'
        : 'Candidate accounts cannot access the administrative console. Please use the candidate portal.';
      return { success: false, errorReason };
    }

    const signedInUser: User = {
      id: profile.id,
      email: profile.email,
      name: profile.full_name,
      role: profile.role,
      candidateId: profile.role === 'candidate' ? profile.id : undefined,
      department: profile.role === 'admin' ? 'SIRI Caseworker Division' : undefined,
    };
    setUser(signedInUser);
    if (signedInUser.candidateId) portalStore.selectCandidate(signedInUser.candidateId);
    await portalStore.refreshStore();
    return { success: true, role: profile.role, accountStatus: profile.account_status };
  };

  const logout = () => {
    setUser(null);
    void supabase.auth.signOut();
    router.push('/');
  };

  const selectCandidate = (id: string) => {
    portalStore.selectCandidate(id);
  };

  const advanceCandidateStage = (candidateId: string) => {
    const c = portalStore.candidates.find((cand) => cand.id === candidateId);
    if (c && c.currentStage < 6) {
      portalStore.setCandidateStage(candidateId, (c.currentStage + 1) as StageNumber);
    }
  };

  const rollbackCandidateStage = (candidateId: string) => {
    const c = portalStore.candidates.find((cand) => cand.id === candidateId);
    if (c && c.currentStage > 1) {
      portalStore.setCandidateStage(candidateId, (c.currentStage - 1) as StageNumber);
    }
  };

  const setCandidateStage = (candidateId: string, stage: StageNumber) => {
    portalStore.setCandidateStage(candidateId, stage);
  };

  const updateDocumentStatus = (
    candidateId: string,
    docId: string,
    status: DocumentStatus,
    notes?: string
  ) => {
    if (status === 'verified') {
      portalStore.verifyDocument(candidateId, docId);
    } else if (status === 'rejected') {
      portalStore.rejectDocument(candidateId, docId, notes || 'Rejected by caseworker review');
    }
  };

  const addCandidateDocument = (candidateId: string, doc: DocumentRecord) => {
    portalStore.dispatchAdminDocument(candidateId, doc.title, doc.category || 'General', doc.body, false);
  };

  const saveCandidateSignature = (candidateId: string, signatureDataUrl: string) => {
    portalStore.saveCandidateSignature(candidateId, signatureDataUrl);
  };

  const toggleChecklistItem = (candidateId: string, checkId: string) => {
    portalStore.toggleChecklistItem(candidateId, checkId);
  };

  const activeCandidate =
    user?.role === 'candidate'
      ? portalStore.candidates.find((c) => c.id === user.candidateId || c.email.toLowerCase() === user.email.toLowerCase()) ||
        portalStore.candidates[0] ||
        null
      : portalStore.selectedCandidate;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthInitialized,
        candidate: activeCandidate,
        allCandidates: portalStore.candidates,
        login,
        logout,
        selectCandidate,
        advanceCandidateStage,
        rollbackCandidateStage,
        setCandidateStage,
        updateDocumentStatus,
        addCandidateDocument,
        saveCandidateSignature,
        toggleChecklistItem,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
