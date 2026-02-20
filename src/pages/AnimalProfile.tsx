import { useEffect, useState, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUS_CONFIG, SPECIES_CONFIG, SEX_CONFIG, SIZE_CONFIG, formatAge, type AnimalStatus } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronDown, Copy, Sparkles, ClipboardList } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Animal = Tables<"animals">;
type StatusLog = Tables<"animal_status_log">;

export default function AnimalProfile() {
  const { id } = useParams<{ id: string }>();
  const { shelterId } = useAuth();
  const { toast } = useToast();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const fetchAnimal = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from("animals").select("*").eq("id", id).single();
    setAnimal(data);
    const { data: logs } = await supabase.from("animal_status_log").select("*").eq("animal_id", id).order("created_at", { ascending: false });
    setStatusLogs(logs ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchAnimal(); }, [fetchAnimal]);

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!animal) return <Navigate to="/animals" replace />;

  const sp = SPECIES_CONFIG[animal.species as keyof typeof SPECIES_CONFIG] ?? SPECIES_CONFIG.other;
  const sex = SEX_CONFIG[animal.sex as keyof typeof SEX_CONFIG] ?? SEX_CONFIG.unknown;
  const size = SIZE_CONFIG[animal.size as keyof typeof SIZE_CONFIG];

  const handleStatusChange = async (newStatus: string) => {
    const { error } = await supabase.from("animals").update({
      status: newStatus,
      ...(newStatus === "adopted" ? { adopted_at: new Date().toISOString() } : {}),
    }).eq("id", animal.id);
    if (!error) {
      await supabase.from("animal_status_log").insert({
        animal_id: animal.id,
        old_status: animal.status,
        new_status: newStatus,
      });
      toast({ title: `Státusz: ${STATUS_CONFIG[newStatus as AnimalStatus]?.label}` });
      fetchAnimal();
    }
    setConfirmStatus(null);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-bio", {
        body: { animalId: animal.id },
      });
      if (error) throw error;
      toast({ title: "Bio generálva!" });
      fetchAnimal();
    } catch {
      toast({ title: "Hiba", description: "Nem sikerült a generálás.", variant: "destructive" });
    }
    setGenerating(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Másolva!" });
  };

  const handleSaveAiText = async (field: string, value: string) => {
    await supabase.from("animals").update({ [field]: value }).eq("id", animal.id);
    toast({ title: "Mentve!" });
    setEditingField(null);
    fetchAnimal();
  };

  const otherStatuses = Object.keys(STATUS_CONFIG).filter(s => s !== animal.status) as AnimalStatus[];
  const hasAi = animal.ai_text_short || animal.ai_text_long || animal.ai_text_fit;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT COLUMN */}
      <div className="space-y-4">
        {/* Profile card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{sp.emoji}</span>
                <div>
                  <h1 className="text-xl font-semibold">{animal.name}</h1>
                  {animal.breed_hint && <p className="text-sm text-muted-foreground">{animal.breed_hint} jellegű</p>}
                </div>
              </div>
              <StatusBadge status={animal.status} />
            </div>
            <div className="space-y-2 text-sm">
              <Row label="Faj" value={sp.label} />
              <Row label="Nem" value={sex.label} />
              <Row label="Kor" value={formatAge(animal.date_of_birth, animal.age_years)} />
              {size && <Row label="Méret" value={size.label} />}
              <Row label="Chip" value={animal.chip_id || "—"} />
            </div>
            {animal.notes && (
              <>
                <hr className="my-4 border-border" />
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{animal.notes}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Status change */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Státusz megváltoztatása</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {otherStatuses.map(s => (
              <Button key={s} variant="outline" size="sm" onClick={() => setConfirmStatus(s)} className="text-xs">
                {STATUS_CONFIG[s].emoji} {STATUS_CONFIG[s].label}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Facebook card */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Facebook</CardTitle></CardHeader>
          <CardContent>
            {animal.fb_post_id ? (
              <div className="space-y-2">
                <p className="text-sm text-primary">✓ Posztolva: {animal.fb_posted_at ? new Date(animal.fb_posted_at).toLocaleDateString("hu-HU") : ""}</p>
                {animal.fb_post_url && (
                  <a href={animal.fb_post_url} target="_blank" rel="noreferrer" className="text-sm text-status-adopted hover:underline">Poszt megtekintése →</a>
                )}
              </div>
            ) : (
              <Button variant="outline" size="sm" disabled={!animal.ai_text_short} className="text-xs">
                📘 Posztolás Facebookra
              </Button>
            )}
            {!animal.ai_text_short && !animal.fb_post_id && (
              <p className="text-xs text-muted-foreground mt-2">Előbb generálj AI szöveget</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN */}
      <div className="lg:col-span-2 space-y-4">
        {/* AI texts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-medium">AI Generált Szövegek</CardTitle>
            <Button onClick={handleGenerate} disabled={generating} size="sm" className="gap-2">
              <Sparkles className="h-4 w-4" />
              {generating ? "Generálás..." : hasAi ? "Újragenerálás" : "Bio generálása"}
            </Button>
          </CardHeader>
          <CardContent>
            {!hasAi ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p>Kattints a Bio generálása gombra</p>
              </div>
            ) : (
              <Tabs defaultValue="short">
                <TabsList>
                  <TabsTrigger value="short">📱 FB poszt</TabsTrigger>
                  <TabsTrigger value="long">📄 Hosszú leírás</TabsTrigger>
                  <TabsTrigger value="fit">🎯 Kinek ajánlott</TabsTrigger>
                </TabsList>
                {(["short", "long", "fit"] as const).map(tab => {
                  const field = `ai_text_${tab}` as "ai_text_short" | "ai_text_long" | "ai_text_fit";
                  const text = animal[field] ?? "";
                  return (
                    <TabsContent key={tab} value={tab} className="mt-4">
                      {editingField === field ? (
                        <div className="space-y-2">
                          <Textarea value={editText} onChange={e => setEditText(e.target.value)} rows={8} />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveAiText(field, editText)}>Mentés</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>Mégse</Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed cursor-pointer hover:bg-accent/30 rounded p-2 -m-2 transition-colors"
                             onClick={() => { setEditingField(field); setEditText(text); }}>
                            {text || "—"}
                          </p>
                          <div className="mt-3">
                            <Button variant="outline" size="sm" onClick={() => handleCopy(text)} className="gap-2 text-xs">
                              <Copy className="h-3 w-3" /> Másolás
                            </Button>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Audit log */}
        <Collapsible>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-3 cursor-pointer">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Előzmények</CardTitle>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {statusLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nincs előzmény</p>
                ) : (
                  <div className="space-y-2">
                    {statusLogs.map(log => (
                      <div key={log.id} className="flex items-center gap-3 text-sm">
                        <span className="text-xs text-muted-foreground w-20">{log.created_at ? new Date(log.created_at).toLocaleDateString("hu-HU") : ""}</span>
                        <span>{STATUS_CONFIG[log.old_status as AnimalStatus]?.label ?? "—"} → {STATUS_CONFIG[log.new_status as AnimalStatus]?.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Status confirm modal */}
      <Dialog open={!!confirmStatus} onOpenChange={() => setConfirmStatus(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Biztosan {STATUS_CONFIG[confirmStatus as AnimalStatus]?.label} státuszra állítod?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmStatus(null)}>Mégse</Button>
            <Button onClick={() => confirmStatus && handleStatusChange(confirmStatus)}>Igen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
