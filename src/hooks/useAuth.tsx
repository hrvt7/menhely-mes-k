import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface ShelterInfo {
  id: string;
  name: string;
  slug: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  shelterId: string | null;
  shelterInfo: ShelterInfo | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [shelterId, setShelterId] = useState<string | null>(null);
  const [shelterInfo, setShelterInfo] = useState<ShelterInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        setShelterId(null);
        setShelterInfo(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch shelter info when user changes
  useEffect(() => {
    if (!user) return;
    
    const fetchShelter = async () => {
      const { data: su } = await supabase
        .from("shelter_users")
        .select("shelter_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (su?.shelter_id) {
        setShelterId(su.shelter_id);
        const { data: shelter } = await supabase
          .from("shelters")
          .select("id, name, slug")
          .eq("id", su.shelter_id)
          .single();
        if (shelter) setShelterInfo(shelter);
      } else {
        setShelterId(null);
        setShelterInfo(null);
      }
      setLoading(false);
    };
    
    fetchShelter();
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setShelterId(null);
    setShelterInfo(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, shelterId, shelterInfo, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
