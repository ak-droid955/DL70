// Shared client-side profanity filter for the player-authored fields on the
// create-room and join-room setup forms (name, party name, party code).
// The design spec calls for a live filter that shows an inline error and
// blocks submit; this is a courtesy check on the client only — the server
// stores whatever it is sent, so it is not a security boundary.
const PROFANITY = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'cunt', 'whore', 'slut', 'pussy', 'fag', 'nigger', 'retard',
  'chutiya', 'chutia', 'madarchod', 'maderchod', 'behenchod', 'bhenchod', 'bahenchod', 'bhosdike', 'bhosadike',
  'bhosda', 'randi', 'raand', 'gandu', 'gaand', 'harami', 'haramzada', 'kutte', 'kamina', 'kaminey', 'lund', 'lawde',
  'lawda', 'loda', 'chodu', 'jhatu', 'jhaant', 'bhosad',
  // More Hinglish spellings and short forms.
  'betichod', 'bsdk', 'bhadwa', 'bhadwe', 'bhadve', 'kuttiya', 'kutiya', 'chinal', 'lodu', 'lavde', 'lavda',
  'chutiye', 'chootiya', 'choot', 'jhant', 'tatte', 'gandfat',
  // Common English misspellings used to dodge filters.
  'fuk', 'fck', 'phuck', 'biatch', 'motherfucker', 'porn'
];

// Number/symbol stand-ins for letters ("sh1t", "ch00tiya", "@ss"), undone
// before matching.
const LOOKALIKES: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's',
  '!': 'i'
};

// Lowercase and strip everything that isn't a Latin or Devanagari letter, so
// spacing/punctuation ("c.h.u...") can't slip a word past the list.
function normalizeText(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[013457@$!]/g, (c) => LOOKALIKES[c])
    .replace(/[^a-zऀ-ॿ]/g, '');
}

export function hasProfanity(str: string): boolean {
  const normalized = normalizeText(str);
  if (!normalized) return false;
  return PROFANITY.some((word) => normalized.includes(normalizeText(word)));
}

export const PROFANITY_MESSAGE = 'Please keep it clean — no abusive language allowed.';
