import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateSlug } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Setup() {
  const { user, shelterId, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (shelterId) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const slug = generateSlug(name);
    const { data: shelter, error: shelterErr } = await supabase
      .from("shelters")
      .insert({ name, slug, contact_email: email || null, contact_phone: phone || null })
      .select("id")
      .single();

    if (shelterErr || !shelter) {
      toast({ title: "Hiba", description: "Nem sikerült létrehozni a menhelyet.", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const { error: suErr } = await supabase
      .from("shelter_users")
      .insert({ user_id: user.id, shelter_id: shelter.id, role: "admin" });

    if (suErr) {
      toast({ title: "Hiba", description: "Nem sikerült a felhasználó hozzárendelése.", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    toast({ title: "Kész!", description: "Munkaterület létrehozva." });
    // Force reload to refresh auth context
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center pb-2">
          <div className="text-4xl mb-2">🏠</div>
          <h1 className="text-2xl font-semibold tracking-tight">Menhely beállítása</h1>
          <p className="text-sm text-muted-foreground mt-1">Hozd létre a munkaterületed</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Menhely neve *</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Budai Állatmenhely" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cemail">Kapcsolati email</Label>
              <Input id="cemail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="info@menhely.hu" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefonszám</Label>
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+36 1 234 5678" />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Létrehozás..." : "Munkaterület létrehozása →"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
