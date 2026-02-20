

# ShelterOps — Animal Shelter Management Dashboard

A complete Hungarian-language B2B SaaS admin dashboard for managing animal shelters, built on your existing Supabase backend.

## Design System
- Clean, modern B2B SaaS style inspired by Linear/Notion/Vercel
- Inter font, generous whitespace, custom color palette (primary green #2D7D46, amber, blue)
- Hungarian status badges: Elérhető ✅, Foglalt ⏳, Örökbefogadva 🏠, Várakozás ⏸
- Species icons: 🐕 🐈 🐾

---

## Phase 1: Auth & Layout Foundation

### Login / Registration (`/login`)
- Full-page centered card with 🐾 ShelterOps branding
- Email + password login/signup toggle on same page
- Hungarian error messages, email confirmation flow
- Auto-redirect to `/dashboard` if logged in, to `/setup` if no shelter

### Onboarding (`/setup`)
- Shown only when user has no `shelter_users` record
- Form to create a new shelter (name, email, phone)
- Auto-generates slug, creates shelter + shelter_users records

### Sidebar Navigation & Auth Guard
- Fixed left sidebar with: Áttekintés, Állatok, Import, Beállítások
- Active route highlighting (green), shelter name + logout at bottom
- Auth middleware: unauthenticated → `/login`, no shelter → `/setup`
- Mobile responsive (hamburger or bottom nav)

---

## Phase 2: Dashboard (`/dashboard`)

- 4 stat cards: Összes állat, Elérhető, Foglalt, Örökbefogadva — live counts from Supabase
- Conditional action banners (ready-to-post animals, empty state prompting import)
- Recent animals table (5 newest) with species icon, name, status badge, date
- All data scoped to the user's shelter

---

## Phase 3: Animals List (`/animals`)

- Searchable, filterable table (search by name/chip/breed, filter by status & species)
- URL param support (`?filter=ready`)
- Table columns: animal info, species/age, status badge, Facebook status, AI text status
- "Új állat" button opens a modal form for quick animal creation
- Empty state with import prompt

---

## Phase 4: Animal Profile (`/animals/{id}`)

### Left Column — Profile & Actions
- Animal profile card (name, breed hint, species, sex, age, size, chip, notes)
- Photo management: upload to Supabase Storage, thumbnail grid, lightbox, primary photo marking, delete
- Status change card with confirmation modals, audit logging
- Facebook posting card (post/update/view status)

### Right Column — AI & History
- AI-generated texts in 3 tabs: FB poszt, Hosszú leírás, Kinek ajánlott
- Inline editing of AI texts, copy-to-clipboard
- "Bio generálása" button triggers AI generation via edge function
- Collapsible audit log showing status change history

---

## Phase 5: AI Bio Generation (Edge Function)

- Supabase Edge Function `generate-bio` using Lovable AI
- Takes animal data + shelter info, generates 3 Hungarian texts (short FB post, long description, ideal adopter profile)
- Saves results to the `animals` table
- Loading states and error handling with Hungarian toasts

---

## Phase 6: Import Wizard (`/import`)

### 3-step wizard with progress bar:
1. **Upload**: Drag-and-drop zone for CSV/XLSX/XLS files, parsed client-side
2. **Field Mapping**: Map file columns to ShelterOps fields, auto-mapping for common Hungarian/English column names, 3-row preview
3. **Results**: Stats (created/updated/errors), collapsible error/duplicate details

- Import logic: chip_id matching for updates vs inserts, Hungarian value normalization (kutya→dog, kan→male, etc.)

---

## Phase 7: Settings (`/settings`)

- Shelter info form (name, email, phone, default CTA text)
- Facebook integration section (Page ID input, info about access token)
- Dangerous actions section (account deletion with confirmation)
- Save button updates shelter record

---

## Phase 8: Facebook Posting (Edge Function)

- Supabase Edge Function `facebook-post` for posting to Facebook Pages
- Uses the shelter's stored `facebook_access_token` and `facebook_page_id`
- Posts animal bio + photo to the Facebook page via Meta Graph API
- Updates `fb_post_id`, `fb_post_url`, `fb_posted_at` on the animal record
- Graceful handling when Facebook isn't configured

---

## Toast System
- All actions trigger Hungarian toast notifications (success green, error red, loading blue)
- Auto-dismiss after 3 seconds

