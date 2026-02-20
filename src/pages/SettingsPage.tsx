import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { shelterId, signOut } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", contact_email: "", contact_phone: "", default_cta: "", facebook_page_id: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(() => {
    if (!shelterId) return;
    supabase.from("shelters").select("*").eq("id", shelterId).single().then(({ data }) => {
      if (data) setForm({
        name: data.name,
        contact_email: data.contact_email ?? "",
        contact_phone: data.contact_phone ?? "",
        default_cta: data.default_cta ?? "",
        facebook_page_id: data.facebook_page_id ?? "",
      });
      setLoading(false);
    });
  }, [shelterId]);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("shelters").update({
      name: form.name,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      default_cta: form.default_cta || null,
      facebook_page_id: form.facebook_page_id || null,
    }).eq("id", shelterId!);
    toast({ title: "Mentve!" });
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!shelterId) return;
    await supabase.from("shelter_users").delete().eq("shelter_id", shelterId);
    await supabase.from("shelters").delete().eq("id", shelterId);
    await signOut();
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-40" />
        <Card className="rounded-xl shadow-card">
          <CardContent className="p-5 space-y-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Beállítások</h1>

      <Card className="rounded-xl shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Menhely adatok</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Menhely neve</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-lg" /></div>
          <div className="space-y-2"><Label>Kapcsolati email</Label><Input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} className="rounded-lg" /></div>
          <div className="space-y-2"><Label>Telefonszám</Label><Input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} className="rounded-lg" /></div>
          <div className="space-y-2"><Label>Alapértelmezett CTA szöveg</Label><Input value={form.default_cta} onChange={e => setForm({ ...form, default_cta: e.target.value })} placeholder="Írj üzenetet az örökbefogadáshoz!" className="rounded-lg" /></div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Facebook integráció</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Facebook Page ID</Label><Input value={form.facebook_page_id} onChange={e => setForm({ ...form, facebook_page_id: e.target.value })} placeholder="123456789012345" className="font-mono rounded-lg" /></div>
          <div className="rounded-lg bg-status-reserved-bg p-3 text-sm text-status-reserved">A Facebook Access Token beállításához vedd fel velünk a kapcsolatot.</div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="rounded-lg">{saving ? "Mentés..." : "Beállítások mentése"}</Button>

      <Card className="rounded-xl shadow-card border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-destructive">Veszélyes műveletek</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm" onClick={() => setDeleteModal(true)} className="rounded-lg">Fiók törlése</Button>
        </CardContent>
      </Card>

      <Dialog open={deleteModal} onOpenChange={setDeleteModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Biztosan törölni szeretnéd a fiókot?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Ez visszavonhatatlan. Minden adat elvész.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal(false)} className="rounded-lg">Mégse</Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-lg">Igen, törlés</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
