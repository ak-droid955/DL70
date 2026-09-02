# Vote Bank artwork

Drop artwork in this folder and it is picked up automatically — no code change
needed (see `src/lib/voteBankArt.ts`, which globs this directory):

- `<voteBankId>.svg|png|webp` — the round rail icon (square art, ~96×96).
- `<voteBankId>-banner.jpg|png|webp` — the wide banner photo behind the Vote
  Bank name (~1200×260; the name is drawn over it in outlined white type, so
  mid-to-dark images read best).

Valid `voteBankId`s (from `src/lib/types.ts`):

`traders`, `transport_unions`, `rwa`, `unauthorised_colonies`, `govt_staff`,
`women_shg`, `farmers`, `students_youth`, `purvanchali_migrant`,
`community_religious`

Anything missing falls back to the Vote Bank's two-letter short code on its
accent color.
