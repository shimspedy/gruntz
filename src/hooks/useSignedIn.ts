import { useEffect, useState } from 'react';
import { getSupabase } from '../services/supabaseClient';

/**
 * Whether this phone has a Gruntz account signed in. Null until known. Accounts are
 * optional: this is what decides whether the social parts of the app are shown at all.
 */
export function useSignedIn(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) { setSignedIn(false); return undefined; }
    let current = true;
    void supabase.auth.getSession().then(({ data }) => { if (current) setSignedIn(!!data.session?.user.id); }).catch(() => { if (current) setSignedIn(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { if (current) setSignedIn(!!session?.user.id); });
    return () => { current = false; data.subscription.unsubscribe(); };
  }, []);
  return signedIn;
}
