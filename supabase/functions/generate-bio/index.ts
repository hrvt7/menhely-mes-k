import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { animalId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: animal, error: aErr } = await supabase
      .from("animals").select("*").eq("id", animalId).single();
    if (aErr || !animal) throw new Error("Animal not found");

    const { data: shelter } = await supabase
      .from("shelters").select("name, default_cta").eq("id", animal.shelter_id).single();

    const speciesHU: Record<string, string> = { dog: "Kutya", cat: "Macska", other: "Egyéb" };
    const sexHU: Record<string, string> = { male: "Kan", female: "Szuka", unknown: "Ismeretlen" };
    const sizeHU: Record<string, string> = { small: "Kicsi", medium: "Közepes", large: "Nagy", xlarge: "Extra nagy" };

    const prompt = `Te egy állatvédő menhely kommunikációs szakértője vagy. Az alábbi adatok alapján írj 3 különböző szöveget MAGYARUL.

ÁLLAT ADATAI:
- Név: ${animal.name}
- Faj: ${speciesHU[animal.species] ?? animal.species}
- Nem: ${sexHU[animal.sex] ?? "Ismeretlen"}
- Kor: ${animal.age_years ? `${animal.age_years} éves` : "Ismeretlen"}
- Méret: ${sizeHU[animal.size] ?? "Ismeretlen"}
- Fajta tipp: ${animal.breed_hint ? `${animal.breed_hint} jellegű` : "keverék/ismeretlen"}
- Menhely: ${shelter?.name ?? "Menhely"}
- Jellem/megjegyzések: ${animal.notes ?? "Nincs adat"}

SZABÁLYOK:
- SOHA ne állíts biztos fajtát, mindig "jellegű"-t használj
- Ne ígérj semmit egészségügyi állapottal kapcsolatban
- Legyen kedves, meleg hangú de hiteles, nem giccs
- CTA szöveg: "${shelter?.default_cta ?? "Írj üzenetet az örökbefogadáshoz!"}"

Válaszolj PONTOSAN ebben a JSON formátumban (CSAK a JSON-t add vissza, semmi mást):
{
  "ai_text_short": "Facebook poszt, max 800 karakter, emoji-k OK, tartalmaz CTA-t",
  "ai_text_long": "Webes hosszú leírás, 200-350 szó, részletes jellemzés, ideális gazdi",
  "ai_text_fit": "Kinek ajánlott, 80-120 szó, folyó szöveg: lakókörülmény, gyerekek, más állatok, mozgásigény"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        tools: [
          {
            type: "function",
            function: {
              name: "save_bio",
              description: "Save the generated bio texts",
              parameters: {
                type: "object",
                properties: {
                  ai_text_short: { type: "string", description: "Short Facebook post text" },
                  ai_text_long: { type: "string", description: "Long website description" },
                  ai_text_fit: { type: "string", description: "Who is this animal suitable for" },
                },
                required: ["ai_text_short", "ai_text_long", "ai_text_fit"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_bio" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Túl sok kérés, próbáld később." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI kredit szükséges." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const bio = JSON.parse(toolCall.function.arguments);

    await supabase.from("animals").update({
      ai_text_short: bio.ai_text_short,
      ai_text_long: bio.ai_text_long,
      ai_text_fit: bio.ai_text_fit,
    }).eq("id", animalId);

    return new Response(JSON.stringify(bio), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-bio error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
