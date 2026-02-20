import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, ChevronLeft, CheckCircle2, RefreshCw, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";

const FIELDS = [
  { key: "name", label: "Név *", required: true, aliases: ["name", "nev", "név", "állat neve", "animal name"] },
  { key: "species", label: "Faj *", required: true, aliases: ["species", "faj", "type", "típus"] },
  { key: "status", label: "Státusz *", required: true, aliases: ["status", "státusz", "állapot"] },
  { key: "sex", label: "Nem", required: false, aliases: ["sex", "nem", "gender", "ivar"] },
  { key: "age_years", label: "Kor (év)", required: false, aliases: ["age", "kor", "age_years", "életkor"] },
  { key: "chip_id", label: "Chip szám", required: false, aliases: ["chip", "chip_id", "chip szám", "chipszám", "microchip"] },
  { key: "size", label: "Méret", required: false, aliases: ["size", "méret"] },
  { key: "breed_hint", label: "Fajta tipp", required: false, aliases: ["breed", "breed_hint", "fajta", "fajta tipp"] },
  { key: "notes", label: "Megjegyzések", required: false, aliases: ["notes", "megjegyzés", "megjegyzések", "note"] },
];

const NORMALIZE: Record<string, Record<string, string>> = {
  species: { kutya: "dog", dog: "dog", macska: "cat", cat: "cat", egyéb: "other", other: "other" },
  sex: { kan: "male", hím: "male", male: "male", szuka: "female", nőstény: "female", female: "female", ismeretlen: "unknown", unknown: "unknown" },
  status: { elérhető: "available", available: "available", foglalt: "reserved", reserved: "reserved", örökbefogadva: "adopted", adopted: "adopted", várakozás: "on_hold", on_hold: "on_hold" },
  size: { kicsi: "small", small: "small", közepes: "medium", medium: "medium", nagy: "large", large: "large", "extra nagy": "xlarge", xlarge: "xlarge" },
};

function normalize(field: string, value: string): string {
  const map = NORMALIZE[field];
  if (!map) return value;
  return map[value.toLowerCase().trim()] ?? value;
}

export default function Import() {
  const { shelterId } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{ created: number; updated: number; errors: string[] }>({ created: 0, updated: 0, errors: [] });
  const [importing, setImporting] = useState(false);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    const isCSV = file.name.toLowerCase().endsWith('.csv');

    reader.onload = (e) => {
      let wb;
      if (isCSV) {
        // For CSV: read as text with UTF-8, then parse
        const text = e.target?.result as string;
        wb = XLSX.read(text, { type: "string" });
      } else {
        // For XLSX: read as binary
        wb = XLSX.read(e.target?.result, { type: "binary" });
      }
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
      if (data.length === 0) { toast({ title: "Üres fájl", variant: "destructive" }); return; }
      const hdrs = Object.keys(data[0]);
      setHeaders(hdrs);
      setRows(data);

      // Auto-mapping
      const autoMap: Record<string, string> = {};
      FIELDS.forEach(f => {
        const match = hdrs.find(h => f.aliases.includes(h.toLowerCase().trim()));
        if (match) autoMap[f.key] = match;
      });
      setMapping(autoMap);
      setStep(2);
    };

    if (isCSV) {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsBinaryString(file);
    }
  }, [toast]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const requiredMapped = FIELDS.filter(f => f.required).every(f => mapping[f.key]);

  const handleImport = async () => {
    if (!shelterId) return;
    setImporting(true);
    let created = 0, updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const name = mapping.name ? String(row[mapping.name] ?? '').trim() : "";
        const species = mapping.species ? normalize("species", String(row[mapping.species] ?? '').trim()) : "";
        const status = mapping.status ? normalize("status", String(row[mapping.status] ?? '').trim()) : "available";
        if (!name || !species) { errors.push(`${i + 1}. sor: Hiányzó kötelező mező`); continue; }

        const record: any = {
          shelter_id: shelterId,
          name,
          species,
          status,
          sex: mapping.sex ? normalize("sex", String(row[mapping.sex] ?? '').trim()) : null,
          age_years: mapping.age_years ? (Number(row[mapping.age_years]) || null) : null,
          chip_id: mapping.chip_id ? (String(row[mapping.chip_id] ?? '').trim() || null) : null,
          size: mapping.size ? normalize("size", String(row[mapping.size] ?? '').trim()) : null,
          breed_hint: mapping.breed_hint ? (String(row[mapping.breed_hint] ?? '').trim() || null) : null,
          notes: mapping.notes ? (String(row[mapping.notes] ?? '').trim() || null) : null,
        };

        // Check for chip_id duplicate
        if (record.chip_id) {
          const { data: existing } = await supabase.from("animals")
            .select("id").eq("shelter_id", shelterId).eq("chip_id", record.chip_id).maybeSingle();
          if (existing) {
            const { shelter_id: _, ...updateData } = record;
            await supabase.from("animals").update(updateData).eq("id", existing.id);
            updated++;
            continue;
          }
        }

        const { error } = await supabase.from("animals").insert(record);
        if (error) { errors.push(`${i + 1}. sor: ${error.message}`); continue; }
        created++;
      } catch (err: any) {
        errors.push(`${i + 1}. sor: ${err.message}`);
      }
    }

    setResults({ created, updated, errors });
    setStep(3);
    setImporting(false);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight border-b border-border pb-4">Import</h1>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-border"}`} />
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card className="rounded-xl shadow-card">
          <CardContent className="p-8">
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => { const el = document.createElement("input"); el.type = "file"; el.accept = ".csv,.xlsx,.xls"; el.onchange = (ev: any) => { if (ev.target.files[0]) handleFile(ev.target.files[0]); }; el.click(); }}
              className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors duration-150"
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">Húzd ide a fájlt vagy kattints</p>
              <p className="text-sm text-muted-foreground mt-1">CSV, XLSX, XLS támogatott</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Mapping */}
      {step === 2 && (
        <Card className="rounded-xl shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{fileName}</CardTitle>
              <span className="text-sm text-muted-foreground">{rows.length} sor, {headers.length} oszlop</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2 font-medium text-xs uppercase tracking-wider text-muted-foreground">ShelterOps mező</th><th className="text-left py-2 font-medium text-xs uppercase tracking-wider text-muted-foreground">A fájlból</th></tr></thead>
              <tbody>
                {FIELDS.map(f => (
                  <tr key={f.key} className="border-b last:border-0">
                    <td className="py-2">{f.label}</td>
                    <td className="py-2">
                      <Select value={mapping[f.key] || "__none__"} onValueChange={v => setMapping({ ...mapping, [f.key]: v === "__none__" ? "" : v })}>
                        <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue placeholder="— Válassz —" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Nincs —</SelectItem>
                          {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Preview */}
            {rows.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Előnézet (első 3 sor)</p>
                <div className="overflow-x-auto text-xs border rounded-lg">
                  <table className="w-full">
                    <thead><tr className="bg-accent/30 border-b">
                      {FIELDS.filter(f => mapping[f.key]).map(f => <th key={f.key} className="px-3 py-1.5 text-left">{f.label}</th>)}
                    </tr></thead>
                    <tbody>
                      {rows.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          {FIELDS.filter(f => mapping[f.key]).map(f => (
                            <td key={f.key} className="px-3 py-1.5">{String(row[mapping[f.key]] ?? "—")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2 rounded-lg"><ChevronLeft className="h-4 w-4" /> Vissza</Button>
              <Button onClick={handleImport} disabled={!requiredMapped || importing} className="rounded-lg">
                {importing ? "Import folyamatban..." : `Import indítása (${rows.length} sor)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Results */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="rounded-xl shadow-card"><CardContent className="p-5 text-center"><div className="flex items-center justify-center gap-2 mb-1"><CheckCircle2 className="h-5 w-5 text-primary" /><p className="text-2xl font-bold text-primary">{results.created}</p></div><p className="text-sm text-muted-foreground">Létrehozva</p></CardContent></Card>
            <Card className="rounded-xl shadow-card"><CardContent className="p-5 text-center"><div className="flex items-center justify-center gap-2 mb-1"><RefreshCw className="h-5 w-5 text-status-reserved" /><p className="text-2xl font-bold text-status-reserved">{results.updated}</p></div><p className="text-sm text-muted-foreground">Frissítve</p></CardContent></Card>
            <Card className="rounded-xl shadow-card"><CardContent className="p-5 text-center"><div className="flex items-center justify-center gap-2 mb-1"><AlertTriangle className="h-5 w-5 text-destructive" /><p className="text-2xl font-bold text-destructive">{results.errors.length}</p></div><p className="text-sm text-muted-foreground">Hiba</p></CardContent></Card>
          </div>
          {results.errors.length > 0 && (
            <Card className="rounded-xl shadow-card"><CardContent className="p-4"><p className="text-sm font-medium mb-2">Hibák:</p>{results.errors.map((e, i) => <p key={i} className="text-xs text-muted-foreground">{e}</p>)}</CardContent></Card>
          )}
          <div className="flex gap-3">
            <Link to="/animals"><Button className="rounded-lg">Állatok megtekintése →</Button></Link>
            <Button variant="outline" className="rounded-lg" onClick={() => { setStep(1); setRows([]); setHeaders([]); setMapping({}); }}>Új import</Button>
          </div>
        </div>
      )}
    </div>
  );
}
