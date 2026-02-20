import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateSlug } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building, ArrowRight } from "lucide-react";

export default function Setup() {
  const { user, shelterId, loading } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (shelterId) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const slug = generateSlug(name);
      const shelterId = crypto.randomUUID();

      const { error: shelterErr } = await supabase
        .from("shelters")
        .insert({ id: shelterId, name, slug, contact_email: email || null, contact_phone: phone || null });

      if (shelterErr) {
        toast({ title: "Hiba", description: `Menhely létrehozás sikertelen: ${shelterErr.message}`, variant: "destructive" });
        setSubmitting(false);
        return;
      }

      const { error: suErr } = await supabase
        .from("shelter_users")
        .insert({ user_id: user!.id, shelter_id: shelterId, role: "admin" });

      if (suErr) {
        toast({ title: "Hiba", description: `Felhasználó hozzárendelés sikertelen: ${suErr.message}`, variant: "destructive" });
        setSubmitting(false);
        return;
      }

      toast({ title: "Kész!", description: "Munkaterület létrehozva." });
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast({ title: "Hiba", description: err?.message || "Váratlan hiba történt.", variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-card rounded-xl border-border">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[hsl(160,64%,35%)] text-white">
            <Building className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Menhely beállítása</h1>
          <p className="text-sm text-muted-foreground mt-1">Hozd létre a munkaterületed</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Menhely neve *</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Budai Állatmenhely" required className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cemail">Kapcsolati email</Label>
              <Input id="cemail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="info@menhely.hu" className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefonszám</Label>
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+36 1 234 5678" className="rounded-lg" />
            </div>
            <Button type="submit" className="w-full rounded-lg gap-2" disabled={submitting}>
              {submitting ? "Létrehozás..." : "Munkaterület létrehozása"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
