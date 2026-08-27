import type { CSSProperties } from 'react';
import { PARTY_COLOR_SWATCHES, PARTY_SYMBOLS, TURN_TIMER_OPTIONS } from '../lib/types';
import { useGame } from '../state/GameProvider';
import styles from './Setup.module.css';

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
    submitSetup
  } = useGame();

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.heading}>Set up your campaign</div>

        <div>
          <div className={styles.label}>Your name</div>
          <input
            className={styles.input}
            value={state.nameInput}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Priya"
          />
        </div>

        <div>
          <div className={styles.label}>Party name</div>
          <input
            className={styles.input}
            value={state.partyNameInput}
            onChange={(e) => onPartyNameChange(e.target.value)}
            placeholder="e.g. Nagrik Ekta Party"
          />
        </div>

        <div>
          <div className={styles.label}>Party code (optional)</div>
          <input
            className={styles.input}
            value={state.partyCodeInput}
            onChange={(e) => onPartyCodeChange(e.target.value)}
            placeholder="e.g. NEP"
            maxLength={6}
          />
        </div>

        <div>
          <div className={styles.label}>Party colour</div>
          <div className={styles.swatchRow}>
            {PARTY_COLOR_SWATCHES.map((c, i) => (
              <div
                key={c}
                onClick={() => pickColor(i)}
                className={`${styles.swatch} ${i === state.colorChoice ? styles.swatchSelected : ''}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <div className={styles.label}>Party symbol (optional)</div>
          <div className={styles.symbolGrid}>
            {PARTY_SYMBOLS.map((s) => (
              <button
                type="button"
                key={s.label}
                title={s.label}
                aria-label={s.label}
                onClick={() => pickSymbol(s.emoji)}
                className={`${styles.symbolBtn} ${state.symbolChoice === s.emoji ? styles.symbolBtnSelected : ''}`}
              >
                {s.emoji}
              </button>
            ))}
          </div>
          <div className={styles.symbolRow}>
            {state.symbolDataUrl && (
              <div className={styles.symbolPreview} style={{ backgroundImage: `url(${state.symbolDataUrl})` }} />
            )}
            <label className={styles.uploadLabel}>
              or upload your own
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
        </div>

        {state.pendingMode === 'create' && (
          <div>
            <div className={styles.label}>Room timer</div>
            <input
              type="range"
              min={0}
              max={TURN_TIMER_OPTIONS.length - 1}
              step={1}
              value={state.turnTimerChoice}
              onChange={(e) => pickTurnTimer(Number(e.target.value))}
              className={styles.timerSlider}
              style={{ '--pct': `${(state.turnTimerChoice / (TURN_TIMER_OPTIONS.length - 1)) * 100}%` } as CSSProperties}
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
            <div className={styles.timerHint}>How long each turn lasts. Applies to everyone in the room.</div>
          </div>
        )}

        {state.error && <div className={styles.error}>{state.error}</div>}

        <button className={styles.submitBtn} onClick={submitSetup} disabled={state.busy}>
          {state.busy
            ? state.pendingMode === 'create'
              ? 'Creating room…'
              : 'Joining…'
            : state.pendingMode === 'create'
              ? 'Create Room & Join'
              : 'Join Room'}
        </button>
      </div>
    </div>
  );
}
