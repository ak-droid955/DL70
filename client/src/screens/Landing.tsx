import { useEffect, useMemo, useState } from 'react';
import heroBuilding from '../assets/hero-building.jpg';
import { ArchFrieze, FooterMark, Logo } from '../components/Brand';
import { useGame } from '../state/GameProvider';
import ConstituencyMap from './ConstituencyMap';
import styles from './Landing.module.css';

const SLOGANS = [
  'JANTAR MANTAR SE NAHI, VIDHAN SABHA SE CHALEGI DILLI',
  'JEETEGA WOHI JO SETTING KAREGA',
  '70 SEATS, 1 GADDI',
  'VOTE KARO YA KATO',
  'HAR GALI MEIN JUNG, HAR VOTE KEEMTI'
];

const FEATURES = [
  {
    title: 'Real Netas, Real Rivalries',
    body: 'Live PvP against players across Dilli. Har seat ke liye, real-time mein takkar.',
    chip: styles.chipSaffron,
    glyph: <span className={styles.glyphRing} />
  },
  {
    title: 'Rally the Vote',
    body: 'Nukkad sabhas, flex boards, door-to-door — har galli ke liye real players se seedha muqabla.',
    chip: styles.chipBrick,
    glyph: <span className={styles.glyphDiamond} />
  },
  {
    title: 'Manage the Narrative',
    body: "Rival players ka planted scandal, ek press conference se saaf. Spin it right, ya doob jao.",
    chip: styles.chipBlue,
    glyph: <span className={styles.glyphSquare} />
  }
];

// Paper-toned wash over the hero photograph, per the design.
const HERO_OVERLAY =
  'linear-gradient(180deg, oklch(97% 0.01 75 / .85) 0%, oklch(97% 0.01 75 / .45) 50%, oklch(97% 0.01 75 / .8) 100%)';

const SLIDE_COUNT = 3;
const SLIDE_MS = 6000;

export default function Landing() {
  const { state, goCreate, goToJoin } = useGame();
  const [slide, setSlide] = useState(0);
  // The hero's three-stage fade is gated on the background photo being
  // decoded, so the copy doesn't animate in over a blank hero.
  const [heroReady, setHeroReady] = useState(false);
  // The carousel's timer is reset whenever a dot is clicked, so `tick` is
  // bumped to restart the interval effect rather than clearing it by hand.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDE_COUNT), SLIDE_MS);
    return () => clearInterval(id);
  }, [tick]);

  useEffect(() => {
    const img = new Image();
    img.onload = img.onerror = () => setHeroReady(true);
    img.src = heroBuilding;
  }, []);

  const goToSlide = (i: number) => {
    setSlide(i);
    setTick((t) => t + 1);
  };

  const seats = useMemo(() => Object.values(state.staticSeats ?? {}), [state.staticSeats]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Logo size="lg" />
      </header>

      <section
        className={`${styles.hero} ${heroReady ? styles.heroReady : ''}`}
        style={{ backgroundImage: `${HERO_OVERLAY}, url(${heroBuilding})` }}
      >
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            दिल्ली <span className={styles.heroTitleAccent}>Ka Raja</span>
          </h1>
          <p className={styles.heroTagline}>
            रैली nikaalo, गठबंधन banao, aur पीठ में छुर्रा maarne se pehle sochna mat.
          </p>
        </div>

        {/* Outside heroInner (which is capped at 1280px) so the two spots are
            placed against the full-bleed hero, and land on the plaza either
            side of the steps in the artwork. */}
        <div className={styles.heroActions}>
          <span className={styles.heroSpotJoin}>
            <button type="button" className={styles.heroJoin} onClick={goToJoin}>
              Join a Room
            </button>
          </span>
          <span className={styles.heroSpotCreate}>
            <button type="button" className={styles.heroCreate} onClick={goCreate}>
              Create a Room
            </button>
          </span>
        </div>
      </section>

      <div className={styles.marquee}>
        <div className={styles.marqueeTrack}>
          {SLOGANS.concat(SLOGANS).map((text, i) => (
            <span key={i} className={styles.marqueeItem}>
              {text}
              <span className={styles.marqueeDot} />
            </span>
          ))}
        </div>
      </div>

      <ArchFrieze arched />

      <section className={styles.features}>
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>100% Multiplayer · No Bots</span>
          <h2 className={styles.sectionTitle}>Kyun Khelein?</h2>
        </div>
        <div className={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <article key={f.title} className={`${styles.featureCard} ${i === 1 ? styles.featureCardRaised : ''}`}>
              <div className={`${styles.featureChip} ${f.chip}`}>{f.glyph}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureBody}>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.mapBand}>
        <div className={styles.mapInner}>
          <div>
            <span className={styles.eyebrowLight}>The Battlefield</span>
            <h2 className={styles.mapTitle}>
              70 Constituencies.
              <br />
              70 Battles.
            </h2>
            <p className={styles.mapBody}>
              Har seat ka apna mizaaj, apna vote-bank. Chandni Chowk se Chhatarpur tak — poore Dilli ki satta
              tumhare control mein.
            </p>
          </div>
          <div className={styles.mapFrame}>
            {seats.length > 0 ? (
              <ConstituencyMap seats={seats} />
            ) : (
              <div className={styles.mapLoading}>Loading constituencies…</div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.news}>
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>As It Happened</span>
          <h2 className={styles.sectionTitle}>Front Page News</h2>
        </div>

        <div className={styles.carousel}>
          <div className={styles.carouselTrack} style={{ transform: `translateX(-${slide * (100 / SLIDE_COUNT)}%)` }}>
            {/* SLIDE 1 — Hindi newspaper */}
            <div className={`${styles.slide} ${styles.paperSlide}`}>
              <span className={styles.breaking}>BREAKING</span>
              <div className={styles.mastheadRow}>
                <span className={styles.mastheadMeta}>दिल्ली · 25 अगस्त 2026</span>
                <span className={styles.mastheadHi}>दिल्ली दस्तक</span>
                <span className={styles.mastheadMeta}>मूल्य: 1 वोट</span>
              </div>
              <div className={styles.ruleThick} />
              <div className={styles.ruleThin} />
              <div className={styles.storyGrid}>
                <div>
                  <div className={styles.photoSlot} role="img" aria-label="Placeholder rally photograph">
                    <span>rally photo, b/w</span>
                  </div>
                  <p className={styles.caption}>फाइल फोटो: रामलीला मैदान की रैली, कल रात।</p>
                </div>
                <div>
                  <h3 className={styles.headlineHi}>राजा या प्रजा? आज रात फैसला।</h3>
                  <p className={styles.byline}>हमारे राजनीतिक संवाददाता द्वारा · विशेष</p>
                  <div className={`${styles.columns} ${styles.columnsHi}`}>
                    <p>
                      दिल्ली की सड़कों पर एक बार फिर जोश है। हर चौक पे पोस्टर, हर पान की दुकान पे बहस — इस बार का चुनाव
                      सिर्फ सीटों का नहीं, सबका है।
                    </p>
                    <p>सूत्रों का कहना है गठबंधन की बातें चल रही हैं, पर कौन किससे हाथ मिलाएगा — यह राज़ अभी राज़ है।</p>
                    <p>एक चीज़ पक्की है: 70 सीटों का यह खेल, अब शुरू हुआ है।</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SLIDE 2 — English newspaper */}
            <div className={`${styles.slide} ${styles.paperSlide}`}>
              <span className={styles.breaking}>BREAKING</span>
              <div className={styles.mastheadRow}>
                <span className={styles.mastheadMeta}>Delhi · 25 Aug 2026</span>
                <span className={styles.mastheadEn}>The Delhi Herald</span>
                <span className={styles.mastheadMeta}>Price: 1 Vote</span>
              </div>
              <div className={styles.ruleThick} />
              <div className={styles.ruleThin} />
              <div className={styles.storyGrid}>
                <div>
                  <div className={styles.photoSlot} role="img" aria-label="Placeholder rally photograph">
                    <span>rally photo, b/w</span>
                  </div>
                  <p className={styles.caption}>File photo: rally at Ramlila Maidan, last night.</p>
                </div>
                <div>
                  <h3 className={styles.headlineEn}>King or Commoner? Delhi Decides Tonight.</h3>
                  <p className={styles.byline}>By Our Political Correspondent · Exclusive</p>
                  <div className={styles.columns}>
                    <p>
                      The streets of Delhi are electric again. A poster on every corner, a debate at every chai stall —
                      this election isn't just about seats, it's personal.
                    </p>
                    <p>Insiders say alliance talks are underway, but who shakes hands with whom remains anyone's guess.</p>
                    <p>One thing is certain: the game for all 70 seats has only just begun.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SLIDE 3 — social post */}
            <div className={`${styles.slide} ${styles.socialSlide}`}>
              <div className={styles.post}>
                <div className={styles.postHead}>
                  <div className={styles.avatarSlot} aria-hidden="true" />
                  <div className={styles.postAuthor}>
                    <span className={styles.postName}>
                      Rajendra Bhalla <span className={styles.verified}>✓</span>
                    </span>
                    <span className={styles.postMeta}>Candidate, DL-70 · 2 hrs ago · Public</span>
                  </div>
                </div>
                <p className={styles.postBody}>Aaj Karol Bagh mein zabardast rally! Dilli ne dikha diya kaun jeetega.</p>
                <div className={styles.postPhoto} role="img" aria-label="Placeholder rally photograph">
                  <span>rally photo</span>
                </div>
                <div className={styles.postStats}>
                  <span>2.4K reactions</span>
                  <span>891 comments</span>
                  <span>340 shares</span>
                </div>
                <div className={styles.postActions}>
                  <span>Like</span>
                  <span>Comment</span>
                  <span>Share</span>
                </div>
                <div className={styles.comments}>
                  <div className={styles.comment}>
                    <div className={`${styles.commentAvatar} ${styles.commentAvatarSaffron}`}>SV</div>
                    <div className={styles.commentBubble}>
                      <span className={styles.commentName}>Sunita Verma </span>
                      <span className={styles.commentText}>Bhai yeh toh full ON hai!</span>
                      <div className={styles.commentMeta}>Like · Reply · 24</div>
                    </div>
                  </div>
                  <div className={styles.comment}>
                    <div className={`${styles.commentAvatar} ${styles.commentAvatarBlue}`}>VC</div>
                    <div className={styles.commentBubble}>
                      <span className={styles.commentName}>Vikram Chauhan </span>
                      <span className={styles.commentText}>Kal ki rally se bhi bada tha yeh toh.</span>
                      <div className={styles.commentMeta}>Like · Reply · 9</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.dots}>
          {Array.from({ length: SLIDE_COUNT }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === slide}
              className={`${styles.dot} ${i === slide ? styles.dotActive : ''}`}
              onClick={() => goToSlide(i)}
            />
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <FooterMark />
        <span className={styles.footerNote}>© 2026 DL-70. A satirical browser game. Not affiliated with any real party.</span>
        <div className={styles.footerLinks}>
          <span>Privacy</span>
          <span>Terms</span>
          <span>Connect</span>
        </div>
      </footer>
    </div>
  );
}
