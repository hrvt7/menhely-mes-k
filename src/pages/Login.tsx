import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Login() {
  const { user, shelterId, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-2xl text-primary-foreground">
            🐾
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">ShelterOps</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRegister ? "Fiók létrehozása" : "Bejelentkezés"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="pelda@email.hu" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Jelszó</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="confirm">Jelszó megerősítés</Label>
                <Input id="confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
            )}

            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            {success && <div className="rounded-md bg-secondary p-3 text-sm text-secondary-foreground">{success}</div>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Kérlek várj..." : isRegister ? "Regisztráció" : "Bejelentkezés"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isRegister ? "Már van fiókod? " : "Még nincs fiókod? "}
            <button onClick={() => { setIsRegister(!isRegister); setError(""); setSuccess(""); }} className="text-primary font-medium hover:underline">
              {isRegister ? "Bejelentkezés" : "Regisztráció"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
