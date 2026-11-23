import { useEffect, useRef, useState } from 'react';
import aapSymbol from '../assets/parties/aap.png';
import bjpSymbol from '../assets/parties/bjp.png';
import incSymbol from '../assets/parties/inc.png';
import { PROFANITY_MESSAGE, hasProfanity } from '../lib/profanity';
import RoomShell, { shellStyles } from './RoomShell';
import styles from './SinglePlayer.module.css';

// One row in the party details card. An array value renders as chips.
type StatRow = { label: string; value: string | readonly string[] };

// Each party's election symbol (square, transparent-background PNGs) and the
// stats shown in the floating details card when the party is picked. Vote
// share is from the 2025 Delhi assembly election.
const PARTIES: readonly {
  id: 'bjp' | 'aap' | 'inc';
  name: string;
  symbol: string;
  symbolLabel: string;
  stats: readonly StatRow[];
}[] = [
  {
    id: 'bjp',
    name: 'Bharatiya Janata Party',
    symbol: bjpSymbol,
    symbolLabel: 'Lotus',
    stats: [
      { label: 'Last election', value: '45.6%' },
      { label: 'Ideologies', value: ['Hindu nationalism', 'Conservatism'] },
      { label: 'Founders', value: ['Atal Bihari Vajpayee', 'L. K. Advani'] },
      { label: 'Delhi CMs', value: ['Madan Lal Khurana', 'Sahib Singh Verma', 'Sushma Swaraj', 'Rekha Gupta'] },
      { label: 'Jurisdiction', value: 'National' },
      { label: 'Founded', value: '1980' }
    ]
  },
  {
    id: 'aap',
    name: 'Aam Aadmi Party',
    symbol: aapSymbol,
    symbolLabel: 'Broom',
    stats: [
      { label: 'Last election', value: '43.6%' },
      { label: 'Ideologies', value: ['Populism', 'Anti-corruption'] },
      { label: 'Founders', value: ['Arvind Kejriwal'] },
      { label: 'Delhi CMs', value: ['Arvind Kejriwal', 'Atishi'] },
      { label: 'Jurisdiction', value: 'National' },
      { label: 'Founded', value: '2012' }
    ]
  },
  {
    id: 'inc',
    name: 'Indian National Congress',
    symbol: incSymbol,
    symbolLabel: 'Hand',
    stats: [
      { label: 'Last election', value: '6.3%' },
      { label: 'Ideologies', value: ['Secularism', 'Social liberalism'] },
      { label: 'Founders', value: ['A. O. Hume', 'Dadabhai Naoroji'] },
      { label: 'Delhi CMs', value: ['Sheila Dikshit'] },
      { label: 'Jurisdiction', value: 'National' },
      { label: 'Founded', value: '1885' }
    ]
  }
];

// Build-your-own option, shown after the real parties with a plus mark.
const CUSTOM_PARTY: { id: 'custom'; name: string; stats: readonly StatRow[] } = {
  id: 'custom',
  name: 'Custom Party',
  stats: [
    { label: 'Last election', value: '—' },
    { label: 'Ideologies', value: ['Your choice'] },
    { label: 'Founders', value: ['You'] },
    { label: 'Delhi CMs', value: '—' },
    { label: 'Jurisdiction', value: 'Delhi' },
    { label: 'Founded', value: 'Today' }
  ]
};

// Ideologies a Custom Party can pick from (up to MAX_IDEOLOGIES), shown in
// two groups: Indian political traditions first, then general ones.
const IDEOLOGY_GROUPS = [
  {
    label: 'Indian',
    options: [
      'Gandhism',
      'Hindutva',
      'Integral humanism',
      'Ambedkarism',
      'Nehruvian socialism',
      'Lohiaite socialism',
      'Dravidianism',
      'Sarvodaya',
      'Swadeshi',
      'Social justice',
      'Kisan politics',
      'Federalism'
    ]
  },
  {
    label: 'General',
    options: [
      'Centrism',
      'Conservatism',
      'Liberalism',
      'Social democracy',
      'Socialism',
      'Secularism',
      'Nationalism',
      'Populism',
      'Regionalism',
      'Welfarism',
      'Environmentalism',
      'Anti-corruption'
    ]
  }
] as const;
const MAX_IDEOLOGIES = 2;

type PartyId = (typeof PARTIES)[number]['id'] | typeof CUSTOM_PARTY.id;

// Each mode's explainer, shown under the mode buttons once one is picked.
// A Delhi majority is 36 of the 70 seats.
const MODES = [
  {
    id: 'one-vs-many',
    label: '1 vs Many',
    tagline: 'You against everyone',
    description:
      'Take on every other party at once, each played by the computer. Win 36 seats on your own.'
  },
  {
    id: 'alliance',
    label: 'Alliance Mode',
    tagline: 'Pick your partners',
    description:
      "Team up with other parties before the vote. The alliance's seats count together towards 36."
  },
  {
    id: 'historical',
    label: 'Historical Elections',
    tagline: "Replay Delhi's past",
    description:
      'Start from the real results of a past Delhi assembly election and see if you can change how it turned out.'
  }
] as const;

type ModeId = (typeof MODES)[number]['id'];

/** Single-player entry page: pick the party you will play as, and a mode. */
export default function SinglePlayer() {
  const [selected, setSelected] = useState<PartyId | null>(null);
  const [mode, setMode] = useState<ModeId | null>(null);
  // Which page of the flow is showing: the party/mode picker, or the page
  // that follows Next for the 1 vs Many mode. Kept in this component so the
  // picks survive going back.
  const [page, setPage] = useState<'pick' | 'one-vs-many'>('pick');
  // The side panel opens on every party click and can be closed without
  // clearing the selection.
  const [panelOpen, setPanelOpen] = useState(false);
  // Symbol the player uploads for their Custom Party, centre-cropped to a
  // square PNG data URL. Local to this page for now.
  const [customSymbol, setCustomSymbol] = useState<string | null>(null);
  // Name for the Custom Party, editable from its details card via the pen.
  const [customName, setCustomName] = useState<string>(CUSTOM_PARTY.name);
  const [editingName, setEditingName] = useState(false);
  // Ideologies picked for the Custom Party, and whether the picker is open.
  const [customIdeologies, setCustomIdeologies] = useState<string[]>([]);
  const [ideologyPickerOpen, setIdeologyPickerOpen] = useState(false);
  const toggleIdeology = (idea: string) =>
    setCustomIdeologies((cur) =>
      cur.includes(idea) ? cur.filter((i) => i !== idea) : cur.length < MAX_IDEOLOGIES ? [...cur, idea] : cur
    );
  const [nameDraft, setNameDraft] = useState('');

  const startEditingName = () => {
    setNameDraft(customName);
    setEditingName(true);
  };
  // Live check against the shared English + Hinglish profanity list.
  const nameBlocked = hasProfanity(nameDraft);
  // Enter: only saves a clean, non-blank name; an abusive one stays in the
  // field with the error showing.
  const saveName = () => {
    if (nameBlocked) return;
    const trimmed = nameDraft.trim();
    if (trimmed) setCustomName(trimmed);
    setEditingName(false);
  };
  // Clicking away: keep a clean name, otherwise drop the edit.
  const finishEditingName = () => {
    if (!nameBlocked) saveName();
    else setEditingName(false);
  };

  const onCustomSymbolFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = 192;
        canvas.height = 192;
        canvas
          .getContext('2d')
          ?.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 192, 192);
        setCustomSymbol(canvas.toDataURL('image/png'));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const pick = (id: PartyId) => {
    setSelected(id);
    setPanelOpen(true);
    setIdeologyPickerOpen(false);
  };

  // The details card is only up while a party is being looked at: it closes
  // on Escape or on any click outside both the card and the party tiles
  // (clicking another tile just switches it).
  const panelRef = useRef<HTMLElement>(null);
  const partyGridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || partyGridRef.current?.contains(target)) return;
      setPanelOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [panelOpen]);

  const activeMode = MODES.find((m) => m.id === mode);
  const canProceed = mode !== null && (mode === 'historical' || selected !== null);
  const real = PARTIES.find((p) => p.id === selected);
  const detail = selected === CUSTOM_PARTY.id ? CUSTOM_PARTY : real;

  const goNext = () => {
    if (mode === 'one-vs-many') {
      setPanelOpen(false);
      setPage('one-vs-many');
    }
  };

  // 1 vs Many: pick your candidate and see your opponents. Your card's
  // picture area is left blank until candidate images are added, and the
  // opponent slots and Start Game don't do anything yet.
  if (page === 'one-vs-many' && selected) {
    const you = real
      ? { name: real.name, symbol: real.symbol, alt: `${real.symbolLabel} symbol`, custom: false }
      : { name: customName, symbol: customSymbol, alt: 'Your party symbol', custom: true };
    const rivals = PARTIES.filter((p) => p.id !== selected);
    return (
      <RoomShell variant="booth">
        <div className={styles.column}>
          <div className={`${shellStyles.card} ${styles.card} ${styles.candidateCard}`}>
            <button type="button" className={styles.cardBack} onClick={() => setPage('pick')}>
              ← Back
            </button>
            <h1 className={`${styles.heading} ${styles.candidateHeading}`}>Select Your Candidate</h1>
            <p className={styles.candidateSub}>1 vs Many · Choose your opponents</p>

            <div className={styles.lineup}>
              <div className={styles.lineupSlot}>
                <button type="button" className={styles.candidateBox} aria-label="Choose your candidate">
                  <span className={styles.candidatePhoto} aria-hidden="true" />
                  <span className={styles.candidateParty}>
                    {you.symbol ? (
                      <img
                        className={`${styles.candidateSymbol} ${you.custom ? styles.customLogo : ''}`}
                        src={you.symbol}
                        alt={you.alt}
                      />
                    ) : (
                      <span className={`${styles.plus} ${styles.candidateSymbol}`} aria-hidden="true">
                        +
                      </span>
                    )}
                    <span className={styles.candidatePartyName}>{you.name}</span>
                  </span>
                </button>
                <span className={styles.lineupLabel}>You</span>
              </div>

              {rivals.map((r) => (
                <div key={r.id} className={styles.lineupSlot}>
                  <button
                    type="button"
                    className={styles.opponentSlot}
                    aria-label={`Choose ${r.name} candidate`}
                  >
                    <span aria-hidden="true">+</span>
                  </button>
                  <span className={styles.lineupLabel}>Computer</span>
                  <span className={styles.lineupParty}>{r.name}</span>
                </div>
              ))}
            </div>

            <button type="button" className={`${styles.nextBtn} ${styles.startBtn}`}>
              Start Game
            </button>
          </div>
        </div>
      </RoomShell>
    );
  }

  return (
    <RoomShell variant="booth">
      <div className={`${styles.column} ${panelOpen ? styles.columnShifted : ''}`}>
        <div className={`${shellStyles.card} ${styles.card}`}>
          <h1 className={styles.heading}>Select Your Party</h1>
          <div ref={partyGridRef} className={styles.grid} role="radiogroup" aria-label="Party">
            {PARTIES.map((party) => {
              const isSelected = selected === party.id;
              return (
                <button
                  key={party.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`${styles.slot} ${isSelected ? styles.slotSelected : ''}`}
                  onClick={() => pick(party.id)}
                >
                  <img className={styles.logo} src={party.symbol} alt={`${party.symbolLabel} symbol`} />
                  <span className={styles.name}>{party.name}</span>
                </button>
              );
            })}
            <button
              type="button"
              role="radio"
              aria-checked={selected === CUSTOM_PARTY.id}
              className={`${styles.slot} ${selected === CUSTOM_PARTY.id ? styles.slotSelected : ''}`}
              onClick={() => pick(CUSTOM_PARTY.id)}
            >
              {customSymbol ? (
                <img className={`${styles.logo} ${styles.customLogo}`} src={customSymbol} alt="Your party symbol" />
              ) : (
                <span className={styles.plus} aria-hidden="true">
                  +
                </span>
              )}
              <span className={styles.name}>{customName}</span>
            </button>
          </div>
        </div>

        {/* Game modes, in their own card below the party card. Single choice;
            nothing acts on the chosen mode yet. */}
        <div className={`${shellStyles.card} ${styles.card} ${styles.modeCard}`}>
          <h2 className={styles.heading}>Select Mode</h2>
          <div className={styles.modes} role="radiogroup" aria-label="Game mode">
            {MODES.map((m) => {
              const isSelected = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`${styles.modeBtn} ${isSelected ? styles.modeBtnSelected : ''}`}
                  onClick={() => setMode(m.id)}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Explainer for the picked mode. */}
          {/* All three explainers share one grid cell so the box is always as
              tall as the longest one; only the picked mode's is visible. */}
          {activeMode && (
            <div className={styles.modeInfoStack}>
              {MODES.map((m) => {
                const shown = m.id === activeMode.id;
                return (
                  <div
                    key={m.id}
                    className={`${styles.modeInfo} ${shown ? styles.modeInfoShown : ''}`}
                    aria-hidden={!shown}
                  >
                    <h3 className={styles.modeInfoTitle}>{m.label}</h3>
                    <p className={styles.modeInfoTagline}>{m.tagline}</p>
                    <p className={styles.modeInfoText}>{m.description}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Next needs a mode, and a party too unless the mode is Historical
              Elections (which replays real parties, so none is picked).
              What it leads to is still to come. */}
          {mode && !canProceed && <p className={styles.nextHint}>Select your party above to continue.</p>}
          {canProceed && (
            <button type="button" className={styles.nextBtn} onClick={goNext}>
              Next →
            </button>
          )}
        </div>
      </div>

      {/* Party details: a small floating card that slides in on the right.
          Stays mounted so it can animate out. */}
      <aside
        ref={panelRef}
        className={`${styles.panel} ${panelOpen ? styles.panelOpen : ''}`}
        aria-hidden={!panelOpen}
        aria-label={detail ? `${detail.name} details` : undefined}
      >
        {detail && (
          <>
            <button
              type="button"
              className={styles.panelClose}
              onClick={() => setPanelOpen(false)}
              aria-label="Close"
              tabIndex={panelOpen ? 0 : -1}
            >
              ×
            </button>
            {real ? (
              <img className={styles.panelLogo} src={real.symbol} alt={`${real.symbolLabel} symbol`} />
            ) : (
              // Custom Party: the plus (or the uploaded symbol) opens the
              // file picker / photo gallery.
              <label className={styles.uploadSymbol}>
                {customSymbol ? (
                  <img
                    className={`${styles.panelLogo} ${styles.customLogo}`}
                    src={customSymbol}
                    alt="Your party symbol"
                  />
                ) : (
                  <span className={`${styles.plus} ${styles.panelPlus}`} aria-hidden="true">
                    +
                  </span>
                )}
                <span className={styles.uploadHint}>{customSymbol ? 'Change symbol' : 'Upload symbol'}</span>
                <input
                  className={styles.fileInput}
                  type="file"
                  accept="image/*"
                  tabIndex={panelOpen ? 0 : -1}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onCustomSymbolFile(file);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
            {selected !== CUSTOM_PARTY.id ? (
              <h2 className={styles.panelName}>{detail.name}</h2>
            ) : editingName ? (
              <form
                className={styles.nameEdit}
                onSubmit={(e) => {
                  e.preventDefault();
                  saveName();
                }}
              >
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={finishEditingName}
                  onKeyDown={(e) => {
                    // Escape cancels the edit rather than closing the card.
                    if (e.key === 'Escape') {
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      setEditingName(false);
                    }
                  }}
                  maxLength={40}
                  aria-label="Party name"
                  aria-invalid={nameBlocked}
                  aria-describedby={nameBlocked ? 'custom-name-error' : undefined}
                  className={`${styles.nameInput} ${nameBlocked ? styles.nameInputError : ''}`}
                  autoFocus
                />
                {nameBlocked && (
                  <p id="custom-name-error" className={styles.nameError} role="alert">
                    {PROFANITY_MESSAGE}
                  </p>
                )}
              </form>
            ) : (
              <div className={styles.nameRow}>
                <h2 className={styles.panelName}>{customName}</h2>
                <button
                  type="button"
                  className={styles.penBtn}
                  onClick={startEditingName}
                  aria-label="Edit party name"
                  tabIndex={panelOpen ? 0 : -1}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path
                      d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
            <dl className={styles.stats}>
              {detail.stats.map((row) => {
                // Custom Party's ideologies are chosen by the player.
                if (selected === CUSTOM_PARTY.id && row.label === 'Ideologies') {
                  return (
                    <div key={row.label} className={`${styles.statRow} ${styles.statRowWrap}`}>
                      <dt>{row.label}</dt>
                      <dd className={styles.chips}>
                        <button
                          type="button"
                          className={`${styles.chip} ${styles.chipButton}`}
                          aria-expanded={ideologyPickerOpen}
                          aria-controls="ideology-picker"
                          tabIndex={panelOpen ? 0 : -1}
                          onClick={() => setIdeologyPickerOpen((o) => !o)}
                        >
                          {customIdeologies.length ? customIdeologies.join(', ') : 'Your choice'}
                          <span aria-hidden="true">{ideologyPickerOpen ? ' ▴' : ' ▾'}</span>
                        </button>
                      </dd>
                      {ideologyPickerOpen && (
                        <div id="ideology-picker" className={styles.ideologyPicker}>
                          <p className={styles.ideologyHint}>
                            Pick up to {MAX_IDEOLOGIES} ({customIdeologies.length}/{MAX_IDEOLOGIES})
                          </p>
                          {IDEOLOGY_GROUPS.map((group) => (
                            <div key={group.label} className={styles.ideologyGroup}>
                              <p className={styles.ideologyGroupLabel}>{group.label}</p>
                              <div className={styles.ideologyOptions}>
                                {group.options.map((idea) => {
                                  const on = customIdeologies.includes(idea);
                                  const full = !on && customIdeologies.length >= MAX_IDEOLOGIES;
                                  return (
                                    <button
                                      key={idea}
                                      type="button"
                                      aria-pressed={on}
                                      disabled={full}
                                      className={`${styles.ideologyOption} ${on ? styles.ideologyOptionOn : ''}`}
                                      onClick={() => toggleIdeology(idea)}
                                    >
                                      {idea}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          {/* Confirms the picks and folds the list away. */}
                          {customIdeologies.length > 0 && (
                            <button
                              type="button"
                              className={styles.ideologyOk}
                              onClick={() => setIdeologyPickerOpen(false)}
                            >
                              OK
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <div key={row.label} className={styles.statRow}>
                    <dt>{row.label}</dt>
                    {typeof row.value === 'string' ? (
                      <dd>{row.value}</dd>
                    ) : (
                      <dd className={styles.chips}>
                        {row.value.map((v) => (
                          <span key={v} className={styles.chip}>
                            {v}
                          </span>
                        ))}
                      </dd>
                    )}
                  </div>
                );
              })}
            </dl>
          </>
        )}
      </aside>
    </RoomShell>
  );
}
