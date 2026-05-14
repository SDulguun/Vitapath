import {
  BackButton,
  Container,
  Eyebrow,
  PageHeading,
  SectionHeading,
} from "@/app/_components";

const PLACEHOLDER = "bg-surface-soft";

export default function Loading() {
  return (
    <main className="py-12 md:py-16">
      <Container as="section" className="pb-24 md:pb-0">
        <div className="mb-6 -ml-2">
          <BackButton href="/history">Back to history</BackButton>
        </div>
        <Eyebrow>VitaPath · Results</Eyebrow>
        <PageHeading className="mt-3">Your stack</PageHeading>

        <div
          className={`mt-10 animate-pulse rounded-2xl border border-sage-soft/60 bg-surface p-8 shadow-sm`}
          aria-hidden
        >
          <div className="flex items-center justify-between">
            <div className={`h-4 w-28 rounded-pill ${PLACEHOLDER}`} />
            <div className={`h-4 w-20 rounded-pill ${PLACEHOLDER}`} />
          </div>
          <div className={`mx-auto mt-8 size-44 rounded-full ${PLACEHOLDER}`} />
          <div className={`mx-auto mt-6 h-4 w-44 rounded-pill ${PLACEHOLDER}`} />
        </div>

        <section className="mt-10">
          <SectionHeading>Recommendations</SectionHeading>
          <ul className="mt-4 space-y-4" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="animate-pulse rounded-lg border border-sage-soft/60 bg-surface p-6 shadow-sm"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div className={`h-7 w-1/2 rounded-pill ${PLACEHOLDER}`} />
                  <div className={`h-4 w-24 rounded-pill ${PLACEHOLDER}`} />
                </div>
                <div className="mt-5 space-y-2">
                  <div className={`h-3 w-full rounded-pill ${PLACEHOLDER}`} />
                  <div className={`h-3 w-5/6 rounded-pill ${PLACEHOLDER}`} />
                  <div className={`h-3 w-3/4 rounded-pill ${PLACEHOLDER}`} />
                </div>
                <div className={`mt-5 h-14 rounded-md ${PLACEHOLDER}`} />
              </li>
            ))}
          </ul>
        </section>

        <p className="sr-only" role="status" aria-live="polite">
          Loading your results.
        </p>
      </Container>
    </main>
  );
}
