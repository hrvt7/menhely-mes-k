import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Plus, Trash2, Download, FileText } from "lucide-react";
import { DOCUMENT_TYPE_CONFIG, type DocumentType } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Document = Tables<"animal_documents">;

interface Props {
  animalId: string;
  shelterId: string;
}

export function DocumentsSection({ animalId, shelterId }: Props) {
  const { toast } = useToast();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePath, setDeletePath] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const [docType, setDocType] = useState<string>("other");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from("animal_documents")
      .select("*")
      .eq("animal_id", animalId)
      .order("created_at", { ascending: false });
    setDocs(data ?? []);
    setLoading(false);
  }, [animalId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async () => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Hiba", description: "Max 10MB méretű fájl engedélyezett.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const filePath = `${shelterId}/${animalId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("animal-documents").upload(filePath, file);
    if (uploadError) {
      toast({ title: "Hiba", description: "Feltöltés sikertelen.", variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("animal-documents").getPublicUrl(filePath);
    const { error } = await supabase.from("animal_documents").insert({
      animal_id: animalId,
      shelter_id: shelterId,
      document_type: docType,
      file_name: file.name,
      storage_path: filePath,
      url: urlData.publicUrl,
      notes: notes || null,
    });
    setUploading(false);
    if (error) {
      toast({ title: "Hiba", description: "Mentés sikertelen.", variant: "destructive" });
    } else {
      toast({ title: "Dokumentum feltöltve!" });
      setUploadOpen(false);
      setFile(null);
      setNotes("");
      setDocType("other");
      fetchData();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.storage.from("animal-documents").remove([deletePath]);
    await supabase.from("animal_documents").delete().eq("id", deleteId);
    toast({ title: "Dokumentum törölve." });
    setDeleteId(null);
    fetchData();
  };

  const handleDownload = async (storagePath: string, fileName: string) => {
    const { data, error } = await supabase.storage.from("animal-documents").createSignedUrl(storagePath, 60);
    if (error || !data?.signedUrl) {
      toast({ title: "Hiba", description: "Nem sikerült a letöltés.", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <Card className="rounded-xl shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">Dokumentumok</CardTitle>
        <Button size="sm" onClick={() => setUploadOpen(true)} className="gap-1 text-xs rounded-lg">
          <Plus className="h-3 w-3" /> Feltöltés
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Betöltés...</p>
        ) : docs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nincs feltöltött dokumentum</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {docs.map(doc => {
              const typeConfig = DOCUMENT_TYPE_CONFIG[doc.document_type as DocumentType] ?? DOCUMENT_TYPE_CONFIG.other;
              return (
                <div key={doc.id} className="border border-border rounded-lg p-3 hover:bg-accent/30 transition-colors group">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{typeConfig.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-accent text-accent-foreground mt-1")}>
                        {typeConfig.label}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {doc.created_at ? format(new Date(doc.created_at), "yyyy.MM.dd") : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.storage_path, doc.file_name)} className="h-7 gap-1 text-xs">
                      <Download className="h-3 w-3" /> Letöltés
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setDeleteId(doc.id); setDeletePath(doc.storage_path); }}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive ml-auto">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Dokumentum feltöltése</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Dokumentum típusa *</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="rounded-lg text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_TYPE_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fájl *</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files?.[0] ?? null)} className="rounded-lg text-sm" />
              <p className="text-xs text-muted-foreground">PDF, JPG, PNG — max 10MB</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Megjegyzés</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} className="rounded-lg text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} className="rounded-lg">Mégse</Button>
            <Button onClick={handleUpload} disabled={uploading || !file} className="rounded-lg">{uploading ? "Feltöltés..." : "Feltöltés"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Biztosan törlöd a dokumentumot?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-lg">Mégse</Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-lg">Törlés</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
