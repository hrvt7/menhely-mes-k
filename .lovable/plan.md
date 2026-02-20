

# Animal Profile CV Layout + Dashboard Table Redesign + UI Polish

## Priority 1: Animal Profile -- CV/Resume Layout

Complete restructure of `src/pages/AnimalProfile.tsx` from hero-banner layout to a sidebar+content layout inspired by a professional CV/resume.

### Left Sidebar (320px, sticky)
- **Large photo**: 280px square, `rounded-2xl`, `object-cover`. If no photo, gradient placeholder with species emoji centered (e.g., dark-to-muted gradient with large emoji)
- **Upload button** below photo: `+ Foto hozzaadasa` outline style
- **Name**: `text-2xl font-bold` below photo
- **Breed hint**: green text, small
- **Status badge**: prominent colored pill
- Divider
- **Quick facts list** (icon + label pairs, vertically stacked):
  - Faj: Kutya/Macska
  - Nem: Kan/Szuka
  - Kor: X eves
  - Meret: Nagy/Kozepes
  - Chip: monospace number
  - Befogadva: date
- Divider
- **Status change buttons** (compact button group for switching status)
- Divider
- **Quick actions**: Bio generalasa (green primary), Facebook posztolas (outline)

### Right Main Content (flex-1, scrollable)
Organized as sequential card sections with consistent headers (`text-xs font-semibold uppercase tracking-wider text-gray-400` + action button right-aligned):

1. **Bemutatkozo** (AI texts) -- most prominent, top position
   - If AI text exists: show `ai_text_short` as main "about" paragraph
   - If not generated: dashed border empty state card with sparkle icon + generate button
   - `ai_text_long` and `ai_text_fit` as collapsible subsections below

2. **Oltasok** -- moved UP to position 2 (high priority)
   - Compact table with status badges: green "Ervenyes" / amber "Hamarosan lejar" / red "Lejart"
   - `+ Uj oltas` button in section header
   - Uses existing `VaccinationsSection` component (will be slightly restyled)

3. **Egeszsegugyi naplo** -- existing `HealthLogSection`, compact timeline

4. **Befogadasi adatok** -- collapsible (default open), clean 2-column grid, edit button
   - Uses existing `IntakeSection` component

5. **Dokumentumok** -- horizontal scroll card grid, upload button
   - Uses existing `DocumentsSection` component

6. **Fotok** -- 4-column thumbnail grid, primary photo star badge, lightbox
   - Reuse existing photo upload/display logic

7. **Orokbefogadoi adatok** -- conditional (status === adopted), uses `AdopterSection`

8. **Elozmennyek** -- collapsible status log (existing audit log)

### Responsive behavior
- On mobile (`< lg`): stack vertically, sidebar becomes full-width top section with horizontal photo + info layout
- Back link remains at top

---

## Priority 2: Dashboard Table -- Replace AI/FB with Vaccination Column

### Modified: `src/pages/Dashboard.tsx`

**Remove columns**: AI, FB (lines 202-203 headers + cells at 224-231)

**New column**: "Oltas" -- vaccination status per animal

**Data fetching**: extend the existing vaccination query to return per-animal vaccination status, not just overdue count. Fetch all `animal_vaccinations` for the shelter's recent animals and compute:
- Green dot + "Rendben" if all next_due_dates are in the future
- Amber "Hamarosan" if any next_due_date within 30 days  
- Red "Lejart" if any next_due_date < today
- Gray dash if no vaccinations recorded

**New table columns**:
```
Allat | Faj / Kor | Statusz | Befogadva | Oltas | ->
```

---

## Priority 3: StatusBadge Redesign

### Modified: `src/components/StatusBadge.tsx`

Update to softer background colors with borders:
- Elerheto: `bg-emerald-50 text-emerald-700 border border-emerald-200`
- Foglalt: `bg-amber-50 text-amber-700 border border-amber-200`
- Orokbefogadva: `bg-blue-50 text-blue-700 border border-blue-200`
- Varakozas: `bg-gray-50 text-gray-600 border border-gray-200`

---

## Priority 4: Global UI Polish

### Cards
- Increase padding to `p-6` on main content cards
- Add `border border-gray-100 hover:border-gray-200 transition-colors` to interactive cards

### Section headers pattern
```
<div class="flex items-center justify-between mb-4">
  <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400">SECTION NAME</h3>
  <button>+ Action</button>
</div>
```

### Sidebar icons
- Increase icon size from `h-4 w-4` to `h-[18px] w-[18px]` in `AppSidebar.tsx`

### Table rows
- Minimum row height: `py-3.5` (approximately 56px with content)
- More breathing room in cells

### Page headers
- Add `border-b border-gray-100 pb-4 mb-6` to page header divs in Dashboard, Animals, Import, Reports, Settings

### Input focus states
- Update in `src/index.css`: add focus ring style `ring-2 ring-green-500/20 border-green-500`

### Empty states
- Every empty list should have: centered icon/emoji (large, muted), title text, subtitle, and action button

---

## Files Modified

| File | Changes |
|------|---------|
| `src/pages/AnimalProfile.tsx` | Complete restructure to CV layout |
| `src/pages/Dashboard.tsx` | Replace AI/FB columns with vaccination column, add per-animal vax status query |
| `src/components/StatusBadge.tsx` | Softer badge colors with borders |
| `src/components/AppSidebar.tsx` | Larger icons (18px) |
| `src/index.css` | Input focus ring styles |
| `src/pages/Animals.tsx` | Page header border, row height increase |
| `src/pages/Import.tsx` | Page header border |
| `src/pages/Reports.tsx` | Page header border |
| `src/pages/SettingsPage.tsx` | Page header border |

No new files or dependencies needed. All changes use existing components and patterns.

