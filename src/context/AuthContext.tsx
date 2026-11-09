'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, CandidateRecord, StageNumber, DocumentStatus, DocumentRecord } from '@/types';
import { INITIAL_CANDIDATES, MOCK_ADMIN_USER, MOCK_ADMIN_PASSWORD } from '@/data/mockUsers';

interface AuthContextType {
  user: User | null;
  candidate: CandidateRecord | null;
  allCandidates: CandidateRecord[];
  login: (email: string, pass: string) => Promise<{ success: boolean; role?: string }>;
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
  const [user, setUser] = useState<User | null>(null);
  const [allCandidates, setAllCandidates] = useState<CandidateRecord[]>(INITIAL_CANDIDATES);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('cand_dipak_karki');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize candidates & session from localStorage
  useEffect(() => {
    try {
      const savedCandidates = localStorage.getItem('siri_candidates_list');
      if (savedCandidates) {
        setAllCandidates(JSON.parse(savedCandidates));
      } else {
        localStorage.setItem('siri_candidates_list', JSON.stringify(INITIAL_CANDIDATES));
      }

      const savedUser = sessionStorage.getItem('siri_auth_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Error loading session or candidates:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Sync allCandidates to localStorage on updates
  const syncCandidates = (updatedList: CandidateRecord[]) => {
    setAllCandidates(updatedList);
    try {
      localStorage.setItem('siri_candidates_list', JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Could not save candidates to localStorage:', e);
    }
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; role?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check Admin
    if (cleanEmail === MOCK_ADMIN_USER.email.toLowerCase() && pass === MOCK_ADMIN_PASSWORD) {
      const adminUser: User = MOCK_ADMIN_USER;
      setUser(adminUser);
      sessionStorage.setItem('siri_auth_user', JSON.stringify(adminUser));
      return { success: true, role: 'admin' };
    }

    // 2. Check Candidate Accounts
    const matchedCandidate = allCandidates.find((c) => c.email.toLowerCase() === cleanEmail);
    if (matchedCandidate) {
      // Allow Dipak@1983 or general pattern
      let valid = false;
      if (cleanEmail === 'dk3430143@gmail.com' && (pass === 'Dipak@1983' || pass === 'dipak1983')) {
        valid = true;
      } else if (cleanEmail.includes('thapa') && pass === 'Bikash@1988') {
        valid = true;
      } else if (cleanEmail.includes('sunita') && pass === 'Sunita@1991') {
        valid = true;
      } else if (pass.length >= 4) {
        // Fallback for custom testing
        valid = true;
      }

      if (valid) {
        const candidateUser: User = {
          id: `user_${matchedCandidate.id}`,
          email: matchedCandidate.email,
          name: matchedCandidate.name,
          role: 'candidate',
          candidateId: matchedCandidate.id,
        };
        setUser(candidateUser);
        setSelectedCandidateId(matchedCandidate.id);
        sessionStorage.setItem('siri_auth_user', JSON.stringify(candidateUser));
        return { success: true, role: 'candidate' };
      }
    }

    return { success: false };
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('siri_auth_user');
    router.push('/');
  };

  const selectCandidate = (id: string) => {
    setSelectedCandidateId(id);
  };

  // Stage advancement & rollback
  const advanceCandidateStage = (candidateId: string) => {
    const updated = allCandidates.map((c) => {
      if (c.id === candidateId && c.currentStage < 6) {
        const nextStage = (c.currentStage + 1) as StageNumber;
        const updatedStages = c.stages.map((st) => {
          if (st.number === c.currentStage) return { ...st, status: 'completed' as const };
          if (st.number === nextStage) return { ...st, status: 'active' as const };
          return st;
        });
        return { ...c, currentStage: nextStage, stages: updatedStages };
      }
      return c;
    });
    syncCandidates(updated);
  };

  const rollbackCandidateStage = (candidateId: string) => {
    const updated = allCandidates.map((c) => {
      if (c.id === candidateId && c.currentStage > 1) {
        const prevStage = (c.currentStage - 1) as StageNumber;
        const updatedStages = c.stages.map((st) => {
          if (st.number === c.currentStage) return { ...st, status: 'pending' as const };
          if (st.number === prevStage) return { ...st, status: 'active' as const };
          return st;
        });
        return { ...c, currentStage: prevStage, stages: updatedStages };
      }
      return c;
    });
    syncCandidates(updated);
  };

  const setCandidateStage = (candidateId: string, stage: StageNumber) => {
    const updated = allCandidates.map((c) => {
      if (c.id === candidateId) {
        const updatedStages = c.stages.map((st) => {
          if (st.number < stage) return { ...st, status: 'completed' as const };
          if (st.number === stage) return { ...st, status: 'active' as const };
          return { ...st, status: 'pending' as const };
        });
        return { ...c, currentStage: stage, stages: updatedStages };
      }
      return c;
    });
    syncCandidates(updated);
  };

  const updateDocumentStatus = (candidateId: string, docId: string, status: DocumentStatus, notes?: string) => {
    const updated = allCandidates.map((c) => {
      if (c.id === candidateId) {
        const updatedDocs = c.documents.map((d) => {
          if (d.id === docId) {
            return { ...d, status, reviewerNotes: notes !== undefined ? notes : d.reviewerNotes };
          }
          return d;
        });
        return { ...c, documents: updatedDocs };
      }
      return c;
    });
    syncCandidates(updated);
  };

  const addCandidateDocument = (candidateId: string, doc: DocumentRecord) => {
    const updated = allCandidates.map((c) => {
      if (c.id === candidateId) {
        return { ...c, documents: [doc, ...c.documents] };
      }
      return c;
    });
    syncCandidates(updated);
  };

  const saveCandidateSignature = (candidateId: string, signatureDataUrl: string) => {
    const nowStr = new Date().toISOString();
    const updated = allCandidates.map((c) => {
      if (c.id === candidateId) {
        // Also update vfsletter document to verified
        const updatedDocs = c.documents.map((d) => {
          if (d.key === 'vfsletter') {
            return { ...d, status: 'verified' as const };
          }
          return d;
        });
        // Check off checklist item 5
        const updatedChecklist = c.checklist.map((chk) => {
          if (chk.id === 'chk_5') return { ...chk, checked: true };
          return chk;
        });
        return {
          ...c,
          signatureDataUrl,
          signatureTimestamp: nowStr,
          documents: updatedDocs,
          checklist: updatedChecklist,
        };
      }
      return c;
    });
    syncCandidates(updated);
  };

  const toggleChecklistItem = (candidateId: string, checkId: string) => {
    const updated = allCandidates.map((c) => {
      if (c.id === candidateId) {
        const updatedChecklist = c.checklist.map((chk) => {
          if (chk.id === checkId) return { ...chk, checked: !chk.checked };
          return chk;
        });
        return { ...c, checklist: updatedChecklist };
      }
      return c;
    });
    syncCandidates(updated);
  };

  // Find candidate for current session
  const candidate =
    user?.role === 'candidate'
      ? allCandidates.find((c) => c.id === user.candidateId) || allCandidates[0]
      : allCandidates.find((c) => c.id === selectedCandidateId) || allCandidates[0];

  return (
    <AuthContext.Provider
      value={{
        user,
        candidate,
        allCandidates,
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
