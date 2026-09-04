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

// One distinct hue per bank, used for the rail icon chip, the banner fallback,
// the selected-tab accent and the map highlight. Kept as plain sRGB hex so it
// is equally safe in CSS and in the SVG fill attributes Leaflet writes — so a
// bank stays recognisable before any artwork is supplied.
const ACCENTS: Record<VoteBankId, string> = {
  traders: '#d36c00',
  transport_unions: '#9b7e00',
  rwa: '#298646',
  unauthorised_colonies: '#00918b',
  govt_staff: '#2266a4',
  women_shg: '#bc4b87',
  farmers: '#588418',
  students_youth: '#736ace',
  purvanchali_migrant: '#c34f4b',
  community_religious: '#007994'
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
