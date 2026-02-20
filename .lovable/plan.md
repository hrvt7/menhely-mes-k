

# Animal Profile Expansion: 5 New Sections + Dashboard/List Updates

Extending the animal profile page with intake data, vaccinations, health log, documents, and adopter info sections. Plus dashboard and list view updates for overdue vaccine warnings.

---

## Overview

The AnimalProfile page will be restructured: the current left/right column layout stays for the top section, and below it a full-width tabbed area will hold the new sections. A storage bucket is needed for document uploads.

---

## Database Changes

A new Supabase Storage bucket is required:

- Create bucket `animal-documents` (public: false)
- RLS policies on `storage.objects` for authenticated users to upload/download/delete files scoped to their shelter

---

## File Changes

### 1. New Components (extract for readability)

**`src/components/animal/IntakeSection.tsx`**
- Card displaying intake fields: intake_date (datepicker), intake_method (dropdown: Utcarol/Hatosagtol/Gazdatol/Masik menhelytol/Egyeb), intake_person (text), intake_condition (textarea), background_estimate (textarea)
- Chip sub-section: chip_id (text), chip_date (datepicker), chip_vet (text), chip_status (dropdown with colored badge: Regisztralt=green, Nem regisztralt=red, Ismeretlen=gray)
- Edit mode toggle with Save button that UPDATEs the `animals` row
- Props: animal object, onSaved callback

**`src/components/animal/VaccinationsSection.tsx`**
- Table listing vaccinations from `animal_vaccinations` sorted by administered_date DESC
- Overdue logic: next_due_date < today = amber row + "Lejart" badge; within 30 days = "Hamarosan esedékes" badge
- Add button opens inline form: vaccine_name (text), administered_date (datepicker, default today), next_due_date (datepicker), vet_name (text), notes (textarea)
- Save INSERTs into `animal_vaccinations` with shelter_id
- Delete with confirmation dialog
- Props: animalId, shelterId, onDataChange callback

**`src/components/animal/HealthLogSection.tsx`**
- Timeline view, newest first
- Category config map with colors and HU labels: general=gray/Altalanos, treatment=blue/Kezeles, surgery=purple/Mutet, parasite=amber/Parazitairtas, dental=teal/Fogaszat, injury=red/Serules, other=gray/Egyeb
- Each entry: colored left border, date badge, category label, description, vet_name
- Add entry inline form: entry_date (datepicker, default today), category (dropdown), description (textarea), vet_name (text)
- Save INSERTs into `animal_health_log` with shelter_id
- Delete on hover with confirmation
- Props: animalId, shelterId

**`src/components/animal/DocumentsSection.tsx`**
- Grid of document cards (responsive 2-3 columns)
- Document type config with icons and HU labels: intake_form=Befogadasi lap, medical=Orvosi dokumentum, xray=Rontgen, adoption_contract=Orokbefogadasi szerzodes, other=Egyeb
- Each card: file icon, file_name, document_type badge, upload date, download link (opens URL in new tab), delete button
- Upload button opens Dialog: document_type dropdown, file picker (PDF/JPG/PNG, max 10MB), notes textarea
- Upload flow: upload to Supabase Storage `animal-documents/{shelter_id}/{animal_id}/filename`, get public URL, INSERT into `animal_documents`
- Delete: remove from storage + DELETE from table
- Props: animalId, shelterId

**`src/components/animal/AdopterSection.tsx`**
- Only rendered when animal.status === 'adopted'
- Editable fields: adopter_name (text), adopter_email (email), adopter_phone (tel), adopted_at (read-only display)
- 30-day followup: followup_done checkbox, followup_date datepicker (shown when checked)
- Save UPDATEs animals row
- Props: animal object, onSaved callback

### 2. Modified: `src/pages/AnimalProfile.tsx`
- Import the 5 new section components
- Add a full-width Tabs component below the existing grid layout with tabs: "Befogadasi adatok", "Oltasok", "Egeszsegugyi naplo", "Dokumentumok", and conditionally "Orokbefogado" (only when status=adopted)
- Pass animal data, shelterId, and refresh callback to each section

### 3. Modified: `src/pages/Dashboard.tsx`
- After stat cards: query `animal_vaccinations` joined with `animals` to find overdue vaccines (next_due_date < today AND animal status in available/reserved)
- If count > 0: render amber warning banner with count and link to `/animals?filter=overdue_vaccine`

### 4. Modified: `src/pages/Animals.tsx`
- Fetch `animal_vaccinations` for all shelter animals where next_due_date < today
- Build a Set of animal IDs with overdue vaccines
- Show small amber AlertTriangle icon next to animal name in table rows if overdue, with tooltip "Lejart oltas"
- Handle `?filter=overdue_vaccine` search param to filter animals list to only those with overdue vaccines

### 5. Modified: `src/lib/constants.ts`
- Add intake method config map (HU labels)
- Add chip status config map (HU labels + colors)
- Add health log category config (HU labels + colors)
- Add document type config (HU labels + icons)

---

## Technical Notes

- All new sections use the existing Supabase client pattern (`import { supabase } from "@/integrations/supabase/client"`)
- RLS is already set up on the new tables (animal_vaccinations, animal_health_log, animal_documents) scoped by shelter_id via shelter_users
- Storage bucket needs migration SQL for creation + RLS policies on storage.objects
- Datepickers use the existing Calendar/Popover pattern from shadcn with `pointer-events-auto`
- All text in Hungarian
- Consistent card styling: `rounded-xl shadow-card` pattern used throughout

