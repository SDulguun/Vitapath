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
      <Container as="section">
        <div className="mb-6 -ml-2">
          <BackButton href="/">Back to home</BackButton>
        </div>
        <Eyebrow>VitaPath · History</Eyebrow>
        <PageHeading className="mt-3">Your history</PageHeading>

        <section className="mt-10">
          <SectionHeading>Past quizzes</SectionHeading>
          <ul className="mt-4 space-y-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="animate-pulse rounded-lg border border-sage-soft/60 bg-surface p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className={`h-4 w-40 rounded-pill ${PLACEHOLDER}`} />
                    <div className={`h-3 w-24 rounded-pill ${PLACEHOLDER}`} />
                    <div className="flex gap-1.5 pt-1">
                      <div className={`h-5 w-16 rounded-pill ${PLACEHOLDER}`} />
                      <div className={`h-5 w-20 rounded-pill ${PLACEHOLDER}`} />
                    </div>
                  </div>
                  <div className={`size-12 rounded-pill ${PLACEHOLDER}`} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <p className="sr-only" role="status" aria-live="polite">
          Loading your history.
        </p>
      </Container>
    </main>
  );
}
