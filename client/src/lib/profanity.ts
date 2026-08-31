// Shared client-side profanity filter for the player-authored fields on the
// create-room and join-room setup forms (name, party name, party code).
// The design spec calls for a live filter that shows an inline error and
// blocks submit; this is a courtesy check on the client only — the server
// stores whatever it is sent, so it is not a security boundary.
const PROFANITY = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'cunt', 'whore', 'slut', 'pussy', 'fag', 'nigger', 'retard',
  'chutiya', 'chutia', 'madarchod', 'maderchod', 'behenchod', 'bhenchod', 'bahenchod', 'bhosdike', 'bhosadike',
  'bhosda', 'randi', 'raand', 'gandu', 'gaand', 'harami', 'haramzada', 'kutte', 'kamina', 'kaminey', 'lund', 'lawde',
  'lawda', 'loda', 'chodu', 'jhatu', 'jhaant', 'bhosad'
];

// Lowercase and strip everything that isn't a Latin or Devanagari letter, so
// spacing/punctuation ("c.h.u...") can't slip a word past the list.
function normalizeText(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-zऀ-ॿ]/g, '');
}

export function hasProfanity(str: string): boolean {
  const normalized = normalizeText(str);
  if (!normalized) return false;
  return PROFANITY.some((word) => normalized.includes(normalizeText(word)));
}

export const PROFANITY_MESSAGE = 'Please keep it clean — no abusive language allowed.';
