import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PawPrint, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";

export default function Login() {
  const { user, shelterId, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (user && shelterId) return <Navigate to="/dashboard" replace />;
  if (user && !shelterId) return <Navigate to="/setup" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (isRegister) {
      if (password !== confirmPassword) {
        setError("A jelszavak nem egyeznek");
        setSubmitting(false);
        return;
      }
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (err) {
        setError(err.message === "User already registered" ? "Ez az email már regisztrálva van" : err.message);
      } else {
        setSuccess("Ellenőrizd az emailed a megerősítéshez!");
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        if (err.message.includes("Invalid login credentials")) setError("Hibás email vagy jelszó");
        else if (err.message.includes("Email not confirmed")) setError("Erősítsd meg az email címed!");
        else setError(err.message);
      }
    }
    setSubmitting(false);
  };

  const features = [
    "AI-alapú állatleírás generálás",
    "Automatikus Facebook posztolás",
    "Átfogó oltási és egészségügyi napló",
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left panel — hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-[40%] flex-col justify-between p-10"
        style={{ background: 'hsl(var(--sidebar-background))' }}
      >
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(142,72%,29%)] to-[hsl(160,64%,35%)] text-white shadow-md">
              <PawPrint className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">ShelterOps</span>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">
              Az okos menhely<br />szoftver
            </h2>
            <p className="text-[hsl(var(--sidebar-muted))] text-sm leading-relaxed max-w-xs">
              Kezelj állatmenhelyet profi szinten — nyilvántartás, AI, Facebook, egyben.
            </p>
            <div className="space-y-3 pt-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-[hsl(142,72%,50%)] shrink-0" />
                  <span className="text-sm text-[hsl(var(--sidebar-muted))]">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-[hsl(var(--sidebar-muted))]">© 2026 ShelterOps</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-card">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(142,72%,29%)] to-[hsl(160,64%,35%)] text-white shadow-md">
              <PawPrint className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight">ShelterOps</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {isRegister ? "Fiók létrehozása" : "Üdvözöljük"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isRegister ? "Hozd létre a fiókodat a kezdéshez" : "Jelentkezz be a folytatáshoz"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="pelda@email.hu" required className="pl-10 rounded-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Jelszó</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="pl-10 pr-10 rounded-lg" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="confirm">Jelszó megerősítés</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="pl-10 rounded-lg" />
                </div>
              </div>
            )}

            {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            {success && <div className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">{success}</div>}

            <Button type="submit" className="w-full rounded-lg gap-2" disabled={submitting}>
              {submitting ? "Kérlek várj..." : isRegister ? "Regisztráció" : "Bejelentkezés"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isRegister ? "Már van fiókod? " : "Még nincs fiókod? "}
            <button onClick={() => { setIsRegister(!isRegister); setError(""); setSuccess(""); }} className="text-primary font-medium hover:underline">
              {isRegister ? "Bejelentkezés" : "Regisztráció"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
