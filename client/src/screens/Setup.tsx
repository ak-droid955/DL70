import { useEffect, useMemo, type CSSProperties } from 'react';
import { PROFANITY_MESSAGE, hasProfanity } from '../lib/profanity';
import { PARTY_COLOR_SWATCHES, PARTY_SYMBOLS, TURN_TIMER_OPTIONS } from '../lib/types';
import { useOpenRooms } from '../lib/useOpenRooms';
import { useGame } from '../state/GameProvider';
import RoomShell, { shellStyles } from './RoomShell';
import styles from './Setup.module.css';

const MAX_PLAYERS = 5;

export default function Setup() {
  const {
    state,
    onNameChange,
    onPartyNameChange,
    onPartyCodeChange,
    pickColor,
    pickTurnTimer,
    pickSymbol,
    onSymbolFile,
    submitSetup,
    goHome
  } = useGame();

  const isCreate = state.pendingMode === 'create';
  const openRooms = useOpenRooms();
  const activeRoom = openRooms?.find((r) => r.code === state.pendingCode) ?? null;

  // No two players in a room may campaign in the same colour. The list comes
  // from the room:peek that opened this form and is refreshed by the
  // open-rooms poll, so a colour someone claims while this form is open goes
  // grey here too. The server re-checks on join either way.
  const takenColors = useMemo(() => {
    if (isCreate) return new Set<string>();
    return new Set([...state.pendingTakenColors, ...(activeRoom?.takenColors ?? [])]);
  }, [isCreate, state.pendingTakenColors, activeRoom]);
  const colorTaken = takenColors.has(PARTY_COLOR_SWATCHES[state.colorChoice]);

  // Nudge the selection off a colour that's been claimed, so the form never
  // sits on a choice the server would reject.
  useEffect(() => {
    if (!colorTaken) return;
    const free = PARTY_COLOR_SWATCHES.findIndex((c) => !takenColors.has(c));
    if (free >= 0) pickColor(free);
  }, [colorTaken, takenColors, pickColor]);

  const nameBad = hasProfanity(state.nameInput);
  const partyNameBad = hasProfanity(state.partyNameInput);
  const partyCodeBad = hasProfanity(state.partyCodeInput);
  const incomplete = !state.nameInput.trim() || !state.partyNameInput.trim();
  const blocked = incomplete || nameBad || partyNameBad || partyCodeBad || colorTaken;
  const disableSubmit = blocked || state.busy;

  const submitLabel = state.busy
    ? isCreate
      ? 'Creating room…'
      : 'Joining…'
    : isCreate
      ? 'Create Room & Join'
      : 'Join Campaign →';

  const timerPct = (state.turnTimerChoice / (TURN_TIMER_OPTIONS.length - 1)) * 100;

  return (
    <RoomShell variant={isCreate ? 'stage' : 'join'}>
      <div className={`${shellStyles.card} ${styles.card}`}>
        {isCreate ? (
          <h1 className={styles.heading}>Set up your campaign</h1>
        ) : (
          <>
            <button type="button" className={styles.backToRooms} onClick={goHome}>
              ← All rooms
            </button>
            <h1 className={styles.headingSm}>
              Joining {activeRoom ? activeRoom.hostPartyName : `room ${state.pendingCode ?? ''}`}
            </h1>
            <p className={styles.roomMeta}>
              Room {state.pendingCode}
              {activeRoom ? ` · ${activeRoom.playerCount} / ${MAX_PLAYERS} players` : ''}
            </p>
          </>
        )}

        <label className={styles.label} htmlFor="setup-name">
          Your Name
        </label>
        <input
          id="setup-name"
          className={`${styles.input} ${nameBad ? styles.inputError : ''}`}
          value={state.nameInput}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Priya"
        />
        {nameBad && <p className={styles.fieldError}>{PROFANITY_MESSAGE}</p>}
        <div className={styles.fieldGap} />

        <label className={styles.label} htmlFor="setup-party">
          Party Name
        </label>
        <input
          id="setup-party"
          className={`${styles.input} ${partyNameBad ? styles.inputError : ''}`}
          value={state.partyNameInput}
          onChange={(e) => onPartyNameChange(e.target.value)}
          placeholder="e.g. Nagrik Ekta Party"
        />
        {partyNameBad && <p className={styles.fieldError}>{PROFANITY_MESSAGE}</p>}
        <div className={styles.fieldGap} />

        <label className={styles.label} htmlFor="setup-code">
          Party Code <span className={styles.labelHint}>(optional)</span>
        </label>
        <input
          id="setup-code"
          className={`${styles.input} ${styles.inputCode} ${partyCodeBad ? styles.inputError : ''}`}
          value={state.partyCodeInput}
          onChange={(e) => onPartyCodeChange(e.target.value)}
          placeholder="e.g. NEP"
          maxLength={6}
        />
        {partyCodeBad && <p className={styles.fieldError}>{PROFANITY_MESSAGE}</p>}
        <div className={styles.fieldGap} />

        <span className={styles.label}>Party Colour</span>
        <div className={styles.colorGrid}>
          {PARTY_COLOR_SWATCHES.map((color, i) => {
            const taken = takenColors.has(color);
            return (
              <button
                type="button"
                key={color}
                aria-label={`Party colour ${i + 1}${taken ? ' (taken)' : ''}`}
                aria-pressed={i === state.colorChoice}
                disabled={taken}
                title={taken ? 'Already taken by another party in this room' : undefined}
                onClick={() => pickColor(i)}
                className={`${styles.swatch} ${i === state.colorChoice ? styles.swatchSelected : ''} ${
                  taken ? styles.swatchTaken : ''
                }`}
                style={
                  {
                    background: color,
                    '--swatch-ring': i === state.colorChoice ? color : 'transparent'
                  } as CSSProperties
                }
              />
            );
          })}
        </div>
        {!isCreate && takenColors.size > 0 && (
          <p className={styles.colorHint}>Greyed-out colours are already taken in this room.</p>
        )}

        <span className={styles.label}>
          Party Symbol <span className={styles.labelHint}>(optional)</span>
        </span>
        <div className={styles.symbolGrid}>
          {PARTY_SYMBOLS.map((s) => (
            <button
              type="button"
              key={s.label}
              title={s.label}
              aria-label={s.label}
              aria-pressed={state.symbolChoice === s.emoji}
              onClick={() => pickSymbol(s.emoji)}
              className={`${styles.symbolBtn} ${state.symbolChoice === s.emoji ? styles.symbolBtnSelected : ''}`}
            >
              {s.emoji}
            </button>
          ))}
        </div>

        <div className={styles.uploadRow}>
          {state.symbolDataUrl && (
            <span className={styles.symbolPreview} style={{ backgroundImage: `url(${state.symbolDataUrl})` }} />
          )}
          <span className={styles.uploadText}>or upload your own</span>
          <label className={styles.uploadLabel}>
            <span className={styles.uploadBtn}>Choose File</span>
            <input
              className={styles.fileInput}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onSymbolFile(file);
              }}
            />
          </label>
        </div>

        {isCreate && (
          <>
            <span className={`${styles.label} ${styles.labelCentered}`}>Room Timer</span>
            <input
              type="range"
              min={0}
              max={TURN_TIMER_OPTIONS.length - 1}
              step={1}
              value={state.turnTimerChoice}
              onChange={(e) => pickTurnTimer(Number(e.target.value))}
              className={styles.timerSlider}
              style={{ '--pct': `${timerPct}%` } as CSSProperties}
              aria-label="Room timer"
            />
            <div className={styles.timerLabels}>
              {TURN_TIMER_OPTIONS.map((opt, i) => (
                <span
                  key={opt.label}
                  className={`${styles.timerLabel} ${i === state.turnTimerChoice ? styles.timerLabelActive : ''}`}
                >
                  {opt.label}
                </span>
              ))}
            </div>
            <p className={styles.timerHint}>How long each turn lasts. Applies to everyone in the room.</p>
          </>
        )}

        {state.error && <p className={styles.formError}>{state.error}</p>}

        <button
          type="button"
          className={styles.submitBtn}
          onClick={submitSetup}
          disabled={disableSubmit}
          title={incomplete ? 'Enter your name and party name first' : undefined}
        >
          {submitLabel}
        </button>
      </div>
    </RoomShell>
  );
}
