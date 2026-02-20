import { useEffect, useState, useCallback } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
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
import { ChevronDown, Copy, Sparkles, ClipboardList, Plus, Star, X, ChevronLeft, Microchip, Calendar, Dog, Ruler, Users } from "lucide-react";
import { IntakeSection } from "@/components/animal/IntakeSection";
import { VaccinationsSection } from "@/components/animal/VaccinationsSection";
import { HealthLogSection } from "@/components/animal/HealthLogSection";
import { DocumentsSection } from "@/components/animal/DocumentsSection";
import { AdopterSection } from "@/components/animal/AdopterSection";
import type { Tables } from "@/integrations/supabase/types";

type Animal = Tables<"animals">;
type StatusLog = Tables<"animal_status_log">;
type AnimalPhoto = Tables<"animal_photos">;

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
        <Skeleton className="h-48 rounded-xl" />
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
  const primaryPhoto = photos.find(p => p.is_primary);

  const dataPills = [
    { icon: Dog, label: sp.label },
    { icon: Users, label: sex.label },
    { icon: Calendar, label: formatAge(animal.date_of_birth, animal.age_years) },
    ...(size ? [{ icon: Ruler, label: size.label }] : []),
    ...(animal.chip_id ? [{ icon: Microchip, label: animal.chip_id }] : []),
    ...(animal.intake_date ? [{ icon: Calendar, label: new Date(animal.intake_date).toLocaleDateString("hu-HU") }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to="/animals" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" /> Állatok
      </Link>

      {/* Hero banner */}
      <div className="relative rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(222,55%,7%), hsl(222,30%,16%))' }}>
        <div className="h-48 flex items-end justify-center pb-0 relative">
          <StatusBadge status={animal.status} />
          <div className="absolute top-4 right-4">
            <StatusBadge status={animal.status} />
          </div>
        </div>
        <div className="flex flex-col items-center -mt-12 pb-6 relative z-10">
          <div className="h-24 w-24 rounded-full bg-card border-4 border-card flex items-center justify-center text-4xl shadow-card-hover overflow-hidden">
            {primaryPhoto?.url ? (
              <img src={primaryPhoto.url} alt={animal.name} className="h-full w-full object-cover" />
            ) : (
              sp.emoji
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mt-3">{animal.name}</h1>
          {animal.breed_hint && <p className="text-primary text-sm">{animal.breed_hint} jellegű</p>}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleGenerate} disabled={generating} size="sm" className="gap-2 rounded-lg">
          <Sparkles className="h-4 w-4" />
          {generating ? "Generálás..." : hasAi ? "Újragenerálás" : "Bio generálása"}
        </Button>
        {animal.fb_post_url ? (
          <a href={animal.fb_post_url} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="rounded-lg">Facebook poszt →</Button>
          </a>
        ) : (
          <Button variant="outline" size="sm" disabled={!animal.ai_text_short} className="rounded-lg">
            Facebook posztolás
          </Button>
        )}
      </div>

      {/* Data pills */}
      <Card className="rounded-xl shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {dataPills.map((pill, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <pill.icon className="h-4 w-4 text-muted-foreground" />
                <span className={`${pill.icon === Microchip ? 'font-mono text-xs' : ''}`}>{pill.label}</span>
                {i < dataPills.length - 1 && <span className="text-border ml-2">|</span>}
              </div>
            ))}
          </div>
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
                <Row label="Chip" value={animal.chip_id || "—"} mono={!!animal.chip_id} />
              </div>
              {animal.notes && (
                <>
                  <hr className="my-4 border-border" />
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{animal.notes}</p>
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

          <IntakeSection animal={animal} onSaved={fetchAnimal} />
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
                  Posztolás Facebookra
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
            </CardHeader>
            <CardContent>
              {!hasAi ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
                  <p>Kattints a „Bio generálása" gombra</p>
                </div>
              ) : (
                <Tabs defaultValue="short">
                  <TabsList>
                    <TabsTrigger value="short">FB poszt</TabsTrigger>
                    <TabsTrigger value="long">Hosszú leírás</TabsTrigger>
                    <TabsTrigger value="fit">Kinek ajánlott</TabsTrigger>
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

          {/* Photos */}
          <Card className="rounded-xl shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">Fotók</CardTitle>
              <label>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <Button variant="outline" size="sm" className="gap-2 rounded-lg cursor-pointer" asChild disabled={uploading}>
                  <span><Plus className="h-4 w-4" /> {uploading ? "Feltöltés..." : "Fotó"}</span>
                </Button>
              </label>
            </CardHeader>
            <CardContent>
              {photos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nincs fotó — Tölts fel egyet!</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
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
          <TabsTrigger value="vaccinations">Oltások</TabsTrigger>
          <TabsTrigger value="health">Egészségügyi napló</TabsTrigger>
          <TabsTrigger value="documents">Dokumentumok</TabsTrigger>
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

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
