// Status labels and config
export const STATUS_CONFIG = {
  available: { label: "Elérhető", emoji: "✅", colorClass: "bg-status-available-bg text-status-available" },
  reserved: { label: "Foglalt", emoji: "⏳", colorClass: "bg-status-reserved-bg text-status-reserved" },
  adopted: { label: "Örökbefogadva", emoji: "🏠", colorClass: "bg-status-adopted-bg text-status-adopted" },
  on_hold: { label: "Várakozás", emoji: "⏸", colorClass: "bg-status-on-hold-bg text-status-on-hold" },
} as const;

export const SPECIES_CONFIG = {
  dog: { label: "Kutya", emoji: "🐕" },
  cat: { label: "Macska", emoji: "🐈" },
  other: { label: "Egyéb", emoji: "🐾" },
} as const;

export const SEX_CONFIG = {
  male: { label: "Kan" },
  female: { label: "Szuka" },
  unknown: { label: "Ismeretlen" },
} as const;

export const SIZE_CONFIG = {
  small: { label: "Kicsi" },
  medium: { label: "Közepes" },
  large: { label: "Nagy" },
  xlarge: { label: "Extra nagy" },
} as const;

export const INTAKE_METHOD_CONFIG = {
  street: { label: "Utcáról" },
  authority: { label: "Hatóságtól" },
  owner: { label: "Gazdától" },
  shelter: { label: "Másik menhelytől" },
  other: { label: "Egyéb" },
} as const;

export const CHIP_STATUS_CONFIG = {
  registered: { label: "Regisztrált", colorClass: "bg-green-100 text-green-700" },
  not_registered: { label: "Nem regisztrált", colorClass: "bg-red-100 text-red-700" },
  unknown: { label: "Ismeretlen", colorClass: "bg-gray-100 text-gray-600" },
} as const;

export const HEALTH_CATEGORY_CONFIG = {
  general: { label: "Általános", colorClass: "border-l-gray-400", bgClass: "bg-gray-100 text-gray-700" },
  treatment: { label: "Kezelés", colorClass: "border-l-blue-500", bgClass: "bg-blue-100 text-blue-700" },
  surgery: { label: "Műtét", colorClass: "border-l-purple-500", bgClass: "bg-purple-100 text-purple-700" },
  parasite: { label: "Parazitairtás", colorClass: "border-l-amber-500", bgClass: "bg-amber-100 text-amber-700" },
  dental: { label: "Fogászat", colorClass: "border-l-teal-500", bgClass: "bg-teal-100 text-teal-700" },
  injury: { label: "Sérülés", colorClass: "border-l-red-500", bgClass: "bg-red-100 text-red-700" },
  other: { label: "Egyéb", colorClass: "border-l-gray-400", bgClass: "bg-gray-100 text-gray-700" },
} as const;

export const DOCUMENT_TYPE_CONFIG = {
  intake_form: { label: "Befogadási lap", icon: "📋" },
  medical: { label: "Orvosi dokumentum", icon: "🩺" },
  xray: { label: "Röntgen", icon: "🔬" },
  adoption_contract: { label: "Örökbefogadási szerződés", icon: "📄" },
  other: { label: "Egyéb", icon: "📎" },
} as const;

export type IntakeMethod = keyof typeof INTAKE_METHOD_CONFIG;
export type ChipStatus = keyof typeof CHIP_STATUS_CONFIG;
export type HealthCategory = keyof typeof HEALTH_CATEGORY_CONFIG;
export type DocumentType = keyof typeof DOCUMENT_TYPE_CONFIG;

export type AnimalStatus = keyof typeof STATUS_CONFIG;
export type Species = keyof typeof SPECIES_CONFIG;
export type Sex = keyof typeof SEX_CONFIG;
export type Size = keyof typeof SIZE_CONFIG;

export function formatAge(dateOfBirth: string | null, ageYears: number | null): string {
  if (dateOfBirth) {
    const birth = new Date(dateOfBirth);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 12) return `${months} hónapos`;
    const years = Math.floor(months / 12);
    return `${years} éves`;
  }
  if (ageYears !== null) return `${ageYears} éves`;
  return "—";
}

const HU_CHAR_MAP: Record<string, string> = {
  á: "a", é: "e", í: "i", ó: "o", ö: "o", ő: "o", ú: "u", ü: "u", ű: "u",
  Á: "a", É: "e", Í: "i", Ó: "o", Ö: "o", Ő: "o", Ú: "u", Ü: "u", Ű: "u",
};

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .split("")
    .map(ch => HU_CHAR_MAP[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const rand = Math.random().toString(36).substring(2, 6);
  return `${base}-${rand}`;
}
