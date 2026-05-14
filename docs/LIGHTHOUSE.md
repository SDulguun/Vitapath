# Lighthouse audit — vitamin-chi.vercel.app

Captured **2026-05-14**, Lighthouse 13.3.0, mobile form-factor, headless
Chrome on macOS Apple Silicon. Re-run with:

```bash
npx lighthouse@latest https://vitamin-chi.vercel.app/ \
  --only-categories=performance,accessibility,best-practices,seo \
  --form-factor=mobile --output=json --output-path=/tmp/lh.json \
  --quiet --chrome-flags="--headless"
```

## Scores

| Category | Score | Target | Status |
|---|---|---|---|
| Performance | **88** / 100 | ≥ 90 | 2 points shy |
| Accessibility | **95** / 100 | ≥ 95 | meets target |
| Best Practices | **100** / 100 | — | perfect |
| SEO | **100** / 100 | — | perfect |

## Core Web Vitals (mobile, throttled)

| Metric | Value |
|---|---|
| Largest Contentful Paint | 3.0 s |
| First Contentful Paint | 1.5 s |
| Total Blocking Time | 50 ms |
| Cumulative Layout Shift | 0 |
| Speed Index | 6.5 s |
| Time to Interactive | 3.0 s |

## Opportunities

The only flagged opportunity above 100 ms:

- **Reduce unused JavaScript** — 150 ms. Mostly framework code shipped to
  the landing page; addressable later via dynamic imports of below-the-fold
  components if Performance becomes a focus.

## Notes

- The hero photo added in goal 16 is `hidden md:block`, so it does **not**
  affect mobile LCP. The landing's mobile LCP candidate is the serif
  headline text.
- CLS is 0, font display is `swap`, no layout shift from font loading.
- A11y at 95 covers the standard checks; the missing 5 points are likely
  due to text-contrast edge cases on the muted `ink-muted` token — worth
  a Lighthouse a11y trace if pushing for 100.

## For the Week-16 demo

Quote these numbers verbatim in the slide deck:
- **Best Practices 100, SEO 100, Accessibility 95, Performance 88**
- **CLS 0, TBT 50ms**

Take a screenshot of the Lighthouse panel for the deck. The numbers above
are the source of truth — the screenshot is the proof.
