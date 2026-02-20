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
