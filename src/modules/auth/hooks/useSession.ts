import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "../../../shared/api/supabase";

type AuthState = {
  session: Session | null;
  initialized: boolean;
};

export const useAuthStore = create<AuthState>(() => ({
  session: null,
  initialized: false,
}));

export function initAuthListener(): () => void {
  supabase.auth.getSession().then(({ data }) => {
    useAuthStore.setState({ session: data.session, initialized: true });
  });

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.setState({ session, initialized: true });
  });

  return () => data.subscription.unsubscribe();
}

export const useSession = () => useAuthStore((state) => state.session);
export const useAuthInitialized = () =>
  useAuthStore((state) => state.initialized);
