

# ShelterOps Premium UI Redesign + Reports Module

A comprehensive visual overhaul transforming ShelterOps into a premium B2B SaaS dashboard, plus a new Reports page with charts and data export.

---

## Part 1: Design System Overhaul

### CSS Variables and Theme Update (`src/index.css`)
- Replace current light background `#f9f9f7` with `#f8f9fc` (blue-gray tint)
- Update border color to `#eaedf2`
- Add dark sidebar CSS variables (`--sidebar-background: #1a1f2e`, `--sidebar-foreground: white`, `--sidebar-accent: #2a2f3e`)
- Add card shadow utility class and hover-lift animation

### Tailwind Config (`tailwind.config.ts`)
- Add `boxShadow` for card elevation: `card: '0 1px 3px rgba(0,0,0,0.08)'`
- Add hover lift keyframe animation

---

## Part 2: Dark Sidebar Redesign (`src/components/AppSidebar.tsx`)
- Dark background `#1a1f2e` with white/gray text
- Logo: gradient green-to-teal icon + "ShelterOps" bold white text
- Nav items: rounded hover (`#2a2f3e`), active item with bright green left accent border (4px) and green text
- Footer: avatar circle with white initials, shelter name white, email gray, logout as icon button
- Thin separator lines between sections
- Add "Riportok" nav item (BarChart3 icon) between Import and Beallitasok

### Header bar update (`src/components/AppLayout.tsx`)
- Clean top header with sidebar trigger, subtle bottom border

---

## Part 3: Dashboard Premium Cards (`src/pages/Dashboard.tsx`)
- Replace emoji stat cards with Lucide icon in colored circle + gradient left border accent (4px per card color: green, green, amber, blue)
- Large number `text-3xl font-bold`, label below in muted
- Hover lift effect on cards
- Replace spinner with skeleton loading (use `Skeleton` component)
- Fix: only show "Importalj allatokat" banner when `animals.length === 0`

---

## Part 4: Animals List Improvements (`src/pages/Animals.tsx`)
- Make entire table row clickable (wrap `<tr>` with `onClick` navigate to `/animals/{id}`, use `cursor-pointer`)
- Sticky table header
- Hover row color `#f8f9fc`
- Status badges: pill with colored dot + text
- Replace spinner with skeleton rows
- Premium card styling with shadow and rounded-xl

---

## Part 5: Animal Profile Redesign (`src/pages/AnimalProfile.tsx`)
- Hero banner card at top: gradient background, large emoji/photo, name, breed, status badge
- Stats row below hero: chip, age, sex, size displayed as pill badges in a horizontal row
- Replace spinner with skeleton
- Add "Nincs foto" placeholder with upload prompt when no photos
- Premium card styling throughout

---

## Part 6: Settings, Import, Login Polish
- **Settings** (`src/pages/SettingsPage.tsx`): Section cards with subtle header separator, updated input styling (border `#d0d5dd`, focus ring green, border-radius 8px)
- **Import** (`src/pages/Import.tsx`): Replace spinner with skeleton, premium card styling
- **Login** (`src/pages/Login.tsx`): Enhanced card shadow and refined spacing

---

## Part 7: New Reports Page (`src/pages/Reports.tsx`)

### Route and Navigation
- Add route `/reports` in `App.tsx`
- Add "Riportok" with `BarChart3` icon to sidebar nav items

### Page Structure
- Header: "Riportok" h1 + year selector dropdown (current year default, 3 years back)

### Section 1: Annual Summary Cards (4 stat cards)
- Osszes befogadott allat (`created_at` in selected year)
- Sikeresen orokbeadva (`status='adopted'` AND `adopted_at` in selected year)
- Orokbeadasi arany % (adopted/total * 100, circular progress ring SVG)
- Atlagos bentlakasi ido (avg days from `created_at` to `adopted_at`)

### Section 2: Monthly Breakdown Chart
- Recharts `BarChart` with `ResponsiveContainer`
- X-axis: Hungarian month abbreviations (Jan, Feb, Mar, Apr, Maj, Jun, Jul, Aug, Szep, Okt, Nov, Dec)
- Two bars: "Befogadott" (green) + "Orokbeadott" (blue)
- Tooltip with exact numbers using `ChartTooltipContent`

### Section 3: Distribution Charts (2 columns)
- Left: `PieChart` for species distribution (Kutya/Macska/Egyeb)
- Right: `PieChart` for status distribution (Elerheto/Foglalt/Orokbefogadva/Varakozas)

### Section 4: Top Lists (2 columns)
- Left card: "Leghosszabb bentlakok" - top 5 by days in shelter (name + species icon + days badge)
- Right card: "Legutobbi orokbeadasok" - last 5 adopted (name + adopted_at date)

### Section 5: Export
- "Eves riport exportalasa" button generates CSV with: Nev, Faj, Nem, Kor, Befogadva, Orokbeadva, Bentlakasi napok, Statusz
- All queries filtered by shelter_id and selected year

---

## Part 8: Toast System Polish
- Already using Sonner - ensure bottom-right positioning with slide-in animation
- Green success, red error, blue info styling

---

## Technical Details

### Files to create:
- `src/pages/Reports.tsx` - Full reports page with charts

### Files to modify:
- `src/index.css` - Updated CSS variables, card shadows, animations
- `tailwind.config.ts` - Card shadow, hover animation
- `src/components/AppSidebar.tsx` - Dark sidebar, add Reports nav
- `src/components/AppLayout.tsx` - Minor header refinement
- `src/pages/Dashboard.tsx` - Premium stat cards with Lucide icons, skeletons, banner fix
- `src/pages/Animals.tsx` - Clickable rows, sticky header, skeletons
- `src/pages/AnimalProfile.tsx` - Hero banner, pill badges, photo placeholder, skeletons
- `src/pages/SettingsPage.tsx` - Premium form styling, skeletons
- `src/pages/Import.tsx` - Premium styling
- `src/pages/Login.tsx` - Enhanced card styling
- `src/App.tsx` - Add /reports route
- `src/components/StatusBadge.tsx` - Colored dot variant

### Dependencies:
- `recharts` (already installed) for bar and pie charts
- `lucide-react` (already installed) for icons replacing emojis
- No new dependencies needed

