import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "../../../shared/api/supabase";

type AuthState = {
  session: Session | null;
  initialized: boolean;
  // true podczas resetu hasła kodem: użytkownik jest już zalogowany przez Supabase,
  // ale strażnik tras ma go jeszcze traktować jak niezalogowanego
  recovering: boolean;
};

export const useAuthStore = create<AuthState>(() => ({
  session: null,
  initialized: false,
  recovering: false,
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
export const useIsSignedIn = () =>
  useAuthStore((state) => !!state.session && !state.recovering);
