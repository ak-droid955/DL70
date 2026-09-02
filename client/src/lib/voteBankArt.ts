import type { VoteBankId } from './types';

// Rail icons and banner images for the Vote Bank panel. Art is optional: any
// file dropped into src/assets/vote-banks/ named <voteBankId>.<ext> (icon) or
// <voteBankId>-banner.<ext> (wide banner) is bundled and used automatically,
// and anything still missing falls back to the bank's short code on its accent
// color. See that folder's README.
const files = import.meta.glob('../assets/vote-banks/*.{svg,png,webp,jpg,jpeg}', {
  eager: true,
  import: 'default'
}) as Record<string, string>;

const byBasename: Record<string, string> = {};
Object.entries(files).forEach(([path, url]) => {
  const base = path.split('/').pop()!.replace(/\.[^.]+$/, '');
  byBasename[base] = url;
});

// One distinct hue per bank, used for the rail icon chip, the banner fallback
// and the selected-tab accent — so a bank stays recognisable before any
// artwork is supplied.
const ACCENTS: Record<VoteBankId, string> = {
  traders: 'oklch(64% 0.16 55)',
  transport_unions: 'oklch(60% 0.14 95)',
  rwa: 'oklch(55% 0.13 150)',
  unauthorised_colonies: 'oklch(58% 0.13 190)',
  govt_staff: 'oklch(50% 0.12 250)',
  women_shg: 'oklch(58% 0.16 350)',
  farmers: 'oklch(56% 0.14 130)',
  students_youth: 'oklch(58% 0.15 285)',
  purvanchali_migrant: 'oklch(58% 0.15 25)',
  community_religious: 'oklch(52% 0.12 215)'
};

export interface VoteBankArt {
  icon: string | null;
  banner: string | null;
  accent: string;
}

export function voteBankArt(id: VoteBankId): VoteBankArt {
  return {
    icon: byBasename[id] ?? null,
    banner: byBasename[`${id}-banner`] ?? null,
    accent: ACCENTS[id]
  };
}
