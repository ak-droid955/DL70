import { PARTY_COLOR_SWATCHES } from '../lib/types';
import { useGame } from '../state/GameProvider';
import styles from './Setup.module.css';

export default function Setup() {
  const { state, onNameChange, onPartyNameChange, pickColor, onSymbolFile, submitSetup } = useGame();

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
          <div className={styles.symbolRow}>
            {state.symbolDataUrl && (
              <div className={styles.symbolPreview} style={{ backgroundImage: `url(${state.symbolDataUrl})` }} />
            )}
            <input
              className={styles.fileInput}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onSymbolFile(file);
              }}
            />
          </div>
        </div>

        {state.error && <div className={styles.error}>{state.error}</div>}

        <button className={styles.submitBtn} onClick={submitSetup}>
          {state.pendingMode === 'create' ? 'Create Room & Join' : 'Join Room'}
        </button>
      </div>
    </div>
  );
}
