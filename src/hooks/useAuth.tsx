import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { AuthModal, type AuthReason } from "../components/Auth/AuthModal";
import { supabase } from "../lib/supabase";

interface AuthContextValue {
  user: User | null;
  userId: string | null;
  isAnonymous: boolean;
  isPermanent: boolean;
  loading: boolean;
  ensureSession: (forceNew?: boolean) => Promise<string>;
  requireAuth: (
    reason: AuthReason,
    action?: () => void,
    sentenceId?: string | null,
  ) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalReason, setModalReason] = useState<AuthReason>("save");
  const [modalSentenceId, setModalSentenceId] = useState<string | null>(null);
  const pendingAction = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Sync React user state with Supabase auth events, including initial session from storage
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAnonymous = user?.is_anonymous ?? false;
  const userId = user?.id ?? null;
  const isPermanent = !!user && !isAnonymous;

  const ensureSession = useCallback(
    async (forceNew = false): Promise<string> => {
      if (!forceNew) {
        // Use the live session as the source of truth (avoids React-state timing).
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) return session.user.id;
      }

      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.user) {
        throw error ?? new Error("Anonymous sign-in failed");
      }
      return data.user.id;
    },
    [],
  );

  const requireAuth = useCallback(
    async (
      reason: AuthReason,
      action?: () => void,
      sentenceId?: string | null,
    ): Promise<boolean> => {
      const { data } = await supabase.auth.getClaims();
      const permanent = data?.claims?.is_anonymous === false;

      if (permanent) {
        action?.();
        return true;
      }
      pendingAction.current = action ?? null;
      setModalReason(reason);
      setModalSentenceId(sentenceId ?? null);
      setModalOpen(true);
      return false;
    },
    [],
  );

  const handleSuccess = useCallback(() => {
    setModalOpen(false);
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.();
  }, []);

  const handleClose = useCallback(() => {
    setModalOpen(false);
    pendingAction.current = null;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userId,
        isAnonymous,
        isPermanent,
        loading,
        ensureSession,
        requireAuth,
      }}
    >
      {children}
      {modalOpen && (
        <AuthModal
          reason={modalReason}
          sentenceId={modalSentenceId}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
