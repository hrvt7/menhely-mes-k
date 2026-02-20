import { useEffect, useState, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_CONFIG, SPECIES_CONFIG, SEX_CONFIG, SIZE_CONFIG, formatAge, type AnimalStatus } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronDown, Copy, Sparkles, ClipboardList, ImageOff } from "lucide-react";
import { IntakeSection } from "@/components/animal/IntakeSection";
import { VaccinationsSection } from "@/components/animal/VaccinationsSection";
import { HealthLogSection } from "@/components/animal/HealthLogSection";
import { DocumentsSection } from "@/components/animal/DocumentsSection";
import { AdopterSection } from "@/components/animal/AdopterSection";
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-xl" />
        <div className="flex gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }
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
    <div className="space-y-6">
      {/* Hero banner */}
      <Card className="rounded-xl shadow-card overflow-hidden border-0">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent p-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card shadow-card text-4xl">
              {sp.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{animal.name}</h1>
                <StatusBadge status={animal.status} />
              </div>
              {animal.breed_hint && <p className="text-muted-foreground">{animal.breed_hint} jellegű</p>}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: sp.label, value: null },
          { label: sex.label, value: null },
          { label: formatAge(animal.date_of_birth, animal.age_years), value: null },
          ...(size ? [{ label: size.label, value: null }] : []),
          ...(animal.chip_id ? [{ label: `Chip: ${animal.chip_id}`, value: null }] : []),
        ].map((pill, i) => (
          <span key={i} className="inline-flex items-center rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
            {pill.label}
          </span>
        ))}
      </div>

      {/* Photo placeholder */}
      <Card className="rounded-xl shadow-card">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <ImageOff className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Nincs fotó</p>
          <p className="text-xs text-muted-foreground mt-1">Fotó feltöltés hamarosan elérhető</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Profile details */}
          <Card className="rounded-xl shadow-card">
            <CardContent className="p-5">
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
          <Card className="rounded-xl shadow-card">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Státusz megváltoztatása</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {otherStatuses.map(s => (
                <Button key={s} variant="outline" size="sm" onClick={() => setConfirmStatus(s)} className="text-xs rounded-lg">
                  {STATUS_CONFIG[s].label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Intake section */}
          <IntakeSection animal={animal} onSaved={fetchAnimal} />

          {/* Adopter section - only when adopted */}
          {animal.status === "adopted" && <AdopterSection animal={animal} onSaved={fetchAnimal} />}

          {/* Facebook card */}
          <Card className="rounded-xl shadow-card">
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
                <Button variant="outline" size="sm" disabled={!animal.ai_text_short} className="text-xs rounded-lg">
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
          <Card className="rounded-xl shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">AI Generált Szövegek</CardTitle>
              <Button onClick={handleGenerate} disabled={generating} size="sm" className="gap-2 rounded-lg">
                <Sparkles className="h-4 w-4" />
                {generating ? "Generálás..." : hasAi ? "Újragenerálás" : "Bio generálása"}
              </Button>
            </CardHeader>
            <CardContent>
              {!hasAi ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
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
                            <Textarea value={editText} onChange={e => setEditText(e.target.value)} rows={8} className="rounded-lg" />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveAiText(field, editText)} className="rounded-lg">Mentés</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingField(null)} className="rounded-lg">Mégse</Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed cursor-pointer hover:bg-accent/30 rounded-lg p-2 -m-2 transition-colors"
                               onClick={() => { setEditingField(field); setEditText(text); }}>
                              {text || "—"}
                            </p>
                            <div className="mt-3">
                              <Button variant="outline" size="sm" onClick={() => handleCopy(text)} className="gap-2 text-xs rounded-lg">
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
            <Card className="rounded-xl shadow-card">
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
      </div>

      {/* Full-width tabbed sections */}
      <Tabs defaultValue="vaccinations" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="vaccinations">💉 Oltások</TabsTrigger>
          <TabsTrigger value="health">🩺 Egészségügyi napló</TabsTrigger>
          <TabsTrigger value="documents">📁 Dokumentumok</TabsTrigger>
        </TabsList>
        <TabsContent value="vaccinations" className="mt-4">
          {shelterId && <VaccinationsSection animalId={animal.id} shelterId={shelterId} />}
        </TabsContent>
        <TabsContent value="health" className="mt-4">
          {shelterId && <HealthLogSection animalId={animal.id} shelterId={shelterId} />}
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          {shelterId && <DocumentsSection animalId={animal.id} shelterId={shelterId} />}
        </TabsContent>
      </Tabs>

      {/* Status confirm modal */}
      <Dialog open={!!confirmStatus} onOpenChange={() => setConfirmStatus(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Biztosan {STATUS_CONFIG[confirmStatus as AnimalStatus]?.label} státuszra állítod?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmStatus(null)} className="rounded-lg">Mégse</Button>
            <Button onClick={() => confirmStatus && handleStatusChange(confirmStatus)} className="rounded-lg">Igen</Button>
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
