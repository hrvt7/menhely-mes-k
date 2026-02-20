import { useEffect, useState, useCallback } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { STATUS_CONFIG, SPECIES_CONFIG, SEX_CONFIG, SIZE_CONFIG, formatAge, type AnimalStatus } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ChevronDown, Copy, Sparkles, ClipboardList, Plus, Star, X, ChevronLeft,
  Microchip, Calendar, Dog, Ruler, Users, Upload, PawPrint, Cat, HelpCircle
} from "lucide-react";
import { IntakeSection } from "@/components/animal/IntakeSection";
import { VaccinationsSection } from "@/components/animal/VaccinationsSection";
import { HealthLogSection } from "@/components/animal/HealthLogSection";
import { DocumentsSection } from "@/components/animal/DocumentsSection";
import { AdopterSection } from "@/components/animal/AdopterSection";
import type { Tables } from "@/integrations/supabase/types";

type Animal = Tables<"animals">;
type StatusLog = Tables<"animal_status_log">;
type AnimalPhoto = Tables<"animal_photos">;

const SPECIES_ICONS: Record<string, typeof Dog> = { dog: Dog, cat: Cat };

export default function AnimalProfile() {
  const { id } = useParams<{ id: string }>();
  const { shelterId } = useAuth();
  const { toast } = useToast();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([]);
  const [photos, setPhotos] = useState<AnimalPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchAnimal = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from("animals").select("*").eq("id", id).single();
    setAnimal(data);
    const { data: logs } = await supabase.from("animal_status_log").select("*").eq("animal_id", id).order("created_at", { ascending: false });
    setStatusLogs(logs ?? []);
    setLoading(false);
  }, [id]);

  const fetchPhotos = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from("animal_photos").select("*").eq("animal_id", id).order("sort_order", { ascending: true });
    setPhotos(data ?? []);
  }, [id]);

  useEffect(() => { fetchAnimal(); fetchPhotos(); }, [fetchAnimal, fetchPhotos]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-20" />
        <div className="flex flex-col lg:flex-row gap-6">
          <Skeleton className="w-full lg:w-80 h-96 rounded-2xl" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }
  if (!animal) return <Navigate to="/animals" replace />;

  const sp = SPECIES_CONFIG[animal.species as keyof typeof SPECIES_CONFIG] ?? SPECIES_CONFIG.other;
  const sex = SEX_CONFIG[animal.sex as keyof typeof SEX_CONFIG] ?? SEX_CONFIG.unknown;
  const size = SIZE_CONFIG[animal.size as keyof typeof SIZE_CONFIG];
  const SpeciesIcon = SPECIES_ICONS[animal.species] ?? PawPrint;

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !shelterId) return;
    setUploading(true);
    const path = `${shelterId}/${animal.id}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("animal-photos").upload(path, file);
    if (uploadErr) {
      toast({ title: "Hiba", description: "Feltöltés sikertelen.", variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("animal-photos").getPublicUrl(path);
    const isPrimary = photos.length === 0;
    await supabase.from("animal_photos").insert({
      animal_id: animal.id,
      storage_path: path,
      url: urlData.publicUrl,
      is_primary: isPrimary,
      sort_order: photos.length,
    });
    toast({ title: "Fotó feltöltve!" });
    fetchPhotos();
    setUploading(false);
  };

  const handleSetPrimary = async (photoId: string) => {
    await supabase.from("animal_photos").update({ is_primary: false }).eq("animal_id", animal.id);
    await supabase.from("animal_photos").update({ is_primary: true }).eq("id", photoId);
    fetchPhotos();
  };

  const handleDeletePhoto = async (photo: AnimalPhoto) => {
    await supabase.storage.from("animal-photos").remove([photo.storage_path]);
    await supabase.from("animal_photos").delete().eq("id", photo.id);
    fetchPhotos();
  };

  const otherStatuses = Object.keys(STATUS_CONFIG).filter(s => s !== animal.status) as AnimalStatus[];
  const hasAi = animal.ai_text_short || animal.ai_text_long || animal.ai_text_fit;
  const primaryPhoto = photos.find(p => p.is_primary) ?? photos[0];

  const quickFacts = [
    { icon: SpeciesIcon, label: "Faj", value: sp.label },
    { icon: Users, label: "Nem", value: sex.label },
    { icon: Calendar, label: "Kor", value: formatAge(animal.date_of_birth, animal.age_years) },
    ...(size ? [{ icon: Ruler, label: "Méret", value: size.label }] : []),
    ...(animal.chip_id ? [{ icon: Microchip, label: "Chip", value: animal.chip_id, mono: true }] : []),
    ...(animal.intake_date ? [{ icon: Calendar, label: "Befogadva", value: new Date(animal.intake_date).toLocaleDateString("hu-HU") }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to="/animals" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" /> Állatok
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ========== LEFT SIDEBAR ========== */}
        <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6 lg:self-start space-y-5">
          {/* Photo */}
          <div className="relative">
            {primaryPhoto?.url ? (
              <img
                src={primaryPhoto.url}
                alt={animal.name}
                className="w-full aspect-square rounded-2xl object-cover shadow-card"
                style={{ maxHeight: 280 }}
              />
            ) : (
              <div
                className="w-full aspect-square rounded-2xl flex items-center justify-center shadow-card"
                style={{ maxHeight: 280, background: 'linear-gradient(135deg, hsl(222,55%,7%), hsl(222,30%,16%))' }}
              >
                <span className="text-6xl">{sp.emoji}</span>
              </div>
            )}
          </div>

          {/* Upload button */}
          <label className="w-full">
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <Button variant="outline" size="sm" className="w-full gap-2 rounded-lg cursor-pointer" asChild disabled={uploading}>
              <span><Upload className="h-4 w-4" /> {uploading ? "Feltöltés..." : "+ Fotó hozzáadása"}</span>
            </Button>
          </label>

          {/* Name & breed */}
          <div>
            <h1 className="text-2xl font-bold">{animal.name}</h1>
            {animal.breed_hint && <p className="text-sm text-primary mt-0.5">{animal.breed_hint} jellegű</p>}
            <div className="mt-2">
              <StatusBadge status={animal.status} />
            </div>
          </div>

          <Separator />

          {/* Quick facts */}
          <div className="space-y-3">
            {quickFacts.map((fact, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <fact.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{fact.label}</span>
                <span className={`ml-auto font-medium ${'mono' in fact && fact.mono ? 'font-mono text-xs' : ''}`}>{fact.value}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Status change */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Státusz váltás</p>
            <div className="flex flex-wrap gap-2">
              {otherStatuses.map(s => (
                <Button key={s} variant="outline" size="sm" onClick={() => setConfirmStatus(s)} className="text-xs rounded-lg flex-1">
                  {STATUS_CONFIG[s].label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Quick actions */}
          <div className="space-y-2">
            <Button onClick={handleGenerate} disabled={generating} size="sm" className="w-full gap-2 rounded-lg">
              <Sparkles className="h-4 w-4" />
              {generating ? "Generálás..." : hasAi ? "Újragenerálás" : "Bio generálása"}
            </Button>
            {animal.fb_post_url ? (
              <a href={animal.fb_post_url} target="_blank" rel="noreferrer" className="block">
                <Button variant="outline" size="sm" className="w-full rounded-lg">Facebook poszt →</Button>
              </a>
            ) : (
              <Button variant="outline" size="sm" disabled={!animal.ai_text_short} className="w-full rounded-lg">
                Facebook posztolás
              </Button>
            )}
          </div>
        </aside>

        {/* ========== RIGHT CONTENT ========== */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Section 1: Bemutatkozás */}
          <Card className="rounded-xl shadow-card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bemutatkozás</h3>
                {hasAi && (
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(animal.ai_text_short ?? "")} className="gap-1 text-xs h-7">
                    <Copy className="h-3 w-3" /> Másolás
                  </Button>
                )}
              </div>

              {!hasAi ? (
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                  <Sparkles className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground mb-3">Generálj bemutatkozó szöveget az AI segítségével</p>
                  <Button onClick={handleGenerate} disabled={generating} size="sm" className="gap-2 rounded-lg">
                    <Sparkles className="h-4 w-4" />
                    {generating ? "Generálás..." : "Bio generálása"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Main about text */}
                  {editingField === "ai_text_short" ? (
                    <div className="space-y-2">
                      <Textarea value={editText} onChange={e => setEditText(e.target.value)} rows={6} className="rounded-lg" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveAiText("ai_text_short", editText)} className="rounded-lg">Mentés</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingField(null)} className="rounded-lg">Mégse</Button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className="text-sm leading-relaxed cursor-pointer hover:bg-accent/30 rounded-lg p-3 -m-1 transition-colors whitespace-pre-wrap"
                      onClick={() => { setEditingField("ai_text_short"); setEditText(animal.ai_text_short ?? ""); }}
                    >
                      {animal.ai_text_short}
                    </p>
                  )}

                  {/* Collapsible long description */}
                  {animal.ai_text_long && (
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer">
                        <ChevronDown className="h-3 w-3" /> Hosszú leírás
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        {editingField === "ai_text_long" ? (
                          <div className="space-y-2">
                            <Textarea value={editText} onChange={e => setEditText(e.target.value)} rows={8} className="rounded-lg" />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveAiText("ai_text_long", editText)} className="rounded-lg">Mentés</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingField(null)} className="rounded-lg">Mégse</Button>
                            </div>
                          </div>
                        ) : (
                          <p
                            className="text-sm text-muted-foreground leading-relaxed cursor-pointer hover:bg-accent/30 rounded-lg p-3 transition-colors whitespace-pre-wrap"
                            onClick={() => { setEditingField("ai_text_long"); setEditText(animal.ai_text_long ?? ""); }}
                          >
                            {animal.ai_text_long}
                          </p>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Collapsible fit text */}
                  {animal.ai_text_fit && (
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer">
                        <ChevronDown className="h-3 w-3" /> Kinek ajánlott
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        {editingField === "ai_text_fit" ? (
                          <div className="space-y-2">
                            <Textarea value={editText} onChange={e => setEditText(e.target.value)} rows={6} className="rounded-lg" />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveAiText("ai_text_fit", editText)} className="rounded-lg">Mentés</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingField(null)} className="rounded-lg">Mégse</Button>
                            </div>
                          </div>
                        ) : (
                          <p
                            className="text-sm text-muted-foreground leading-relaxed cursor-pointer hover:bg-accent/30 rounded-lg p-3 transition-colors whitespace-pre-wrap"
                            onClick={() => { setEditingField("ai_text_fit"); setEditText(animal.ai_text_fit ?? ""); }}
                          >
                            {animal.ai_text_fit}
                          </p>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Section 2: Oltások (moved UP) */}
          {shelterId && <VaccinationsSection animalId={animal.id} shelterId={shelterId} />}

          {/* Section 3: Egészségügyi napló */}
          {shelterId && <HealthLogSection animalId={animal.id} shelterId={shelterId} />}

          {/* Section 4: Befogadási adatok (collapsible) */}
          <Collapsible defaultOpen>
            <Card className="rounded-xl shadow-card">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-6 pb-0 cursor-pointer">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Befogadási adatok</h3>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-6 pt-4">
                  <IntakeSection animal={animal} onSaved={fetchAnimal} />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 5: Dokumentumok */}
          {shelterId && <DocumentsSection animalId={animal.id} shelterId={shelterId} />}

          {/* Section 6: Fotók */}
          <Card className="rounded-xl shadow-card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fotók</h3>
                <label>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  <Button variant="outline" size="sm" className="gap-2 rounded-lg cursor-pointer text-xs" asChild disabled={uploading}>
                    <span><Plus className="h-3 w-3" /> Fotó</span>
                  </Button>
                </label>
              </div>

              {photos.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Nincs fotó — Tölts fel egyet!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {photos.map(photo => (
                    <div key={photo.id} className="relative group rounded-lg overflow-hidden aspect-square bg-accent cursor-pointer" onClick={() => setLightboxUrl(photo.url)}>
                      <img src={photo.url ?? ''} alt="" className="h-full w-full object-cover" />
                      {photo.is_primary && (
                        <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground rounded-full p-1">
                          <Star className="h-3 w-3" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100">
                        <div className="flex gap-1">
                          {!photo.is_primary && (
                            <Button size="sm" variant="secondary" className="h-7 text-xs rounded-md" onClick={(e) => { e.stopPropagation(); handleSetPrimary(photo.id); }}>
                              <Star className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" className="h-7 text-xs rounded-md" onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo); }}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Section 7: Örökbefogadói adatok */}
          {animal.status === "adopted" && <AdopterSection animal={animal} onSaved={fetchAnimal} />}

          {/* Section 8: Előzmények */}
          <Collapsible>
            <Card className="rounded-xl shadow-card">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-6 pb-3 cursor-pointer">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" /> Előzmények
                  </h3>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6">
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
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </main>
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-3xl p-2">
          {lightboxUrl && <img src={lightboxUrl} alt="" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

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
