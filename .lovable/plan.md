

# Premium UI Redesign -- Apple/Linear/Stripe Level

Complete visual overhaul of every screen in ShelterOps, plus critical bug fixes for Import CSV and photo uploads.

---

## Part 1: Design System Foundation

### `src/index.css`
- Update all CSS variables to match new color palette:
  - `--background`: #f6f8fa (GitHub-style gray)
  - `--primary`: green-600 (#16a34a)
  - `--border`: #e5e7eb
  - `--foreground`: #111827
  - `--muted-foreground`: #6b7280
  - `--sidebar-background`: #0f1623
  - `--sidebar-accent`: #1a2235
  - Active sidebar: #1e3a2f
- Add `font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11'` to body for Inter
- Update card-shadow utility: `0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)`
- Add card-shadow-hover: `0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)`

### `tailwind.config.ts`
- Update boxShadow values to match new design tokens
- Keep existing structure, just value changes

---

## Part 2: Login Page -- Split Layout

### `src/pages/Login.tsx`
- Split layout: left 40% dark (#0f1623) with paw background image at 8% opacity, right 60% white
- Left side: ShelterOps logo, tagline "Az okos menhely szoftver", 3 feature bullets with CheckCircle icons
- Right side: clean form (no outer card wrapper), "Udvozoljuk" h1, subtitle
- Email/password inputs with Mail/Lock lucide icons inside (using relative positioning)
- Password show/hide toggle with Eye/EyeOff icons
- Green primary button full width with ArrowRight icon
- Toggle link for register/login switch
- On mobile: full-width form only (hide left panel)

---

## Part 3: Sidebar Redesign

### `src/components/AppSidebar.tsx`
- Background: #0f1623 (darker than current)
- Logo: rounded-lg green gradient bg (#16a34a to #059669), white PawPrint icon, "ShelterOps" white font-semibold
- Nav items: LayoutDashboard, PawPrint, Upload, BarChart3, Settings icons
- Inactive: text-gray-400, hover bg-[#1a2235] text-gray-200
- Active: bg-[#1e3a2f] text-green-400, left border 2px solid #16a34a
- Bottom: green gradient avatar circle, shelter name white, email text-gray-500, logout icon hover text-red-400
- Use thin border separators between sections

---

## Part 4: Dashboard Overhaul

### `src/pages/Dashboard.tsx`
- Dynamic greeting based on time: "Jo reggelt/napot/estet, [Shelter name]!" with wave emoji
- Today's date right-aligned
- Stat cards: same 4 cards with refined shadows and hover translateY(-1px)
- Quick action bar below stats: "+ Uj allat", "Import", "Bio generalas" as secondary buttons
- Recent animals table expanded to 10 items (from 5)
- Table columns: Allat (icon + name + chip monospace below), Faj/Kor, Statusz, AI checkmark, FB checkmark, Befogadva (relative date), arrow
- Add chip_id display in the table as monospace text under animal name
- Right side "Teendok" widget (or below table on small screens): overdue vaccines count, ready-to-post count, long-residents count (>30 days)
- Replace emoji icons in banners with Lucide icons

---

## Part 5: Animals List Redesign

### `src/pages/Animals.tsx`
- Filter bar: Search input with Search icon inside, rounded-lg
- Status filter as pill toggle buttons (not dropdown): All / Elerheto / Foglalt / Orokbefogadva / Varakozas
- Species filter as pill toggles: Mind / Kutya / Macska / Egyeb
- Table: sticky header bg-[#f9fafb], columns: Allat (icon+name+chip monospace), Kor/Meret, Statusz, AI, Facebook, Befogadva, arrow
- Chip number shown under name in `font-mono text-xs text-gray-400`
- Row hover bg-[#f9fafb]
- All rows clickable (already done)

---

## Part 6: Animal Profile Redesign

### `src/pages/AnimalProfile.tsx`
- Hero section: full-width gradient banner #0f1623 to #1a2235, 200px height
- Large species icon or photo (circular, 100px, white border) overlapping hero bottom
- Name: text-3xl font-bold text-white centered
- Breed hint: text-green-400 below
- Status badge top-right
- Action buttons row: "Bio generalasa" / "Facebook" / "Szerkesztes"
- Data pills row: white card with chip, age, sex, size, intake date as icon+label items
- 2-column layout: left (1/3) for data cards, right (2/3) for AI texts, photos, health tabs
- Photo section: implement actual upload using Supabase Storage `animal-photos` bucket
  - Upload button -> file picker (image/*) -> upload to `animal-photos/{shelter_id}/{animal_id}/{filename}`
  - Get signed URL -> insert into `animal_photos` table
  - Display in 3-column thumbnail grid
  - Primary photo with star badge
  - Click thumbnail for lightbox modal
- Need to create storage bucket `animal-photos` via migration

---

## Part 7: Import Page Bug Fix

### `src/pages/Import.tsx`
- Fix chip_id crash: convert all field values to String before .trim()
  - `String(row[mapping.chip_id] ?? '').trim() || null` for every field
- Apply same pattern to: name, species, status, sex, size, breed_hint, notes
- Read file with UTF-8 encoding explicitly: `reader.readAsText(file, 'UTF-8')` for CSV, keep binary for XLSX
- Premium card styling consistent with rest of app

---

## Part 8: Settings and Setup Polish

### `src/pages/SettingsPage.tsx`
- Replace spinner with skeleton loading
- Section cards with subtle header separators
- Input styling: focus ring green, rounded-lg
- Premium card styling

### `src/pages/Setup.tsx`
- Match login page aesthetic: centered card with gradient accent
- Replace house emoji with Lucide Building icon

---

## Part 9: Reports Page Polish

### `src/pages/Reports.tsx`
- Update chart colors to match new primary (#16a34a) and blue (#3b82f6)
- Premium card styling consistency

---

## Part 10: Toast System

### `src/components/ui/sonner.tsx` or toast config
- Position: bottom-right
- Style updates: white card with colored left border + Lucide icon
- Duration: 4 seconds

---

## Part 11: Storage Bucket for Photos

### Database migration
- Create `animal-photos` storage bucket (public: true for serving images)
- RLS policies on storage.objects for authenticated users scoped to their shelter folder

---

## Technical Details

### Files to modify:
1. `src/index.css` -- CSS variables, font settings, shadow utilities
2. `tailwind.config.ts` -- shadow values update
3. `src/pages/Login.tsx` -- complete redesign with split layout
4. `src/components/AppSidebar.tsx` -- darker theme, refined nav
5. `src/components/AppLayout.tsx` -- header bar refinement
6. `src/pages/Dashboard.tsx` -- greeting, quick actions, expanded table, tasks widget
7. `src/pages/Animals.tsx` -- pill filters, chip display, refined table
8. `src/pages/AnimalProfile.tsx` -- hero banner, photo upload, layout restructure
9. `src/pages/Import.tsx` -- bug fix (String conversion), UTF-8 encoding
10. `src/pages/SettingsPage.tsx` -- skeleton loading, premium styling
11. `src/pages/Setup.tsx` -- visual polish
12. `src/pages/Reports.tsx` -- color updates
13. `src/components/StatusBadge.tsx` -- minor refinement
14. `src/lib/constants.ts` -- add relative date helper function
15. `index.html` -- verify charset UTF-8 meta tag
16. `src/components/ui/sonner.tsx` -- toast position/style

### New file:
- None (photo upload logic integrated into AnimalProfile.tsx)

### Database migration:
- Create `animal-photos` storage bucket + RLS policies

### Dependencies:
- No new dependencies needed
- All icons from lucide-react (LayoutDashboard, Upload, Mail, Lock, Eye, EyeOff, ArrowRight, Search, Building, etc.)

### Paw background image:
- User will attach the image; it will be placed in `public/` or `src/assets/` and referenced via CSS/inline style with 3-8% opacity on login page left panel and optionally sidebar bottom

