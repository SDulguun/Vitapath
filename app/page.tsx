import Link from "next/link";
import {
  BookmarkIcon,
  buttonClasses,
  Card,
  CheckIcon,
  Container,
  Eyebrow,
  InfoCircleIcon,
  SectionHeading,
} from "./_components";

/* Decorative botanical motif — sage leaf behind the hero. Aria-hidden,
   pointer-events disabled, very low opacity per §1.4 ("subtle, not
   wellness-blog garish"). */
function HeroLeaf() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 360"
      className="pointer-events-none absolute right-[-3rem] top-[-2rem] -z-10 h-[26rem] text-sage opacity-[0.06] sm:h-[34rem] sm:right-0 md:opacity-[0.08]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
    >
      <path d="M100 8 C 30 60 18 200 100 350 C 182 200 170 60 100 8 Z" />
      <path d="M100 18 L 100 345" />
      <path d="M100 70 C 78 80 60 90 50 110" />
      <path d="M100 70 C 122 80 140 90 150 110" />
      <path d="M100 130 C 75 140 55 155 45 180" />
      <path d="M100 130 C 125 140 145 155 155 180" />
      <path d="M100 200 C 78 210 60 225 52 250" />
      <path d="M100 200 C 122 210 140 225 148 250" />
      <path d="M100 270 C 85 280 75 290 70 305" />
      <path d="M100 270 C 115 280 125 290 130 305" />
    </svg>
  );
}

const HOW_STEPS = [
  {
    Icon: CheckIcon,
    title: "Answer 5 short prompts",
    body: "Diet, sleep, stress, lifestyle, medications. About two minutes — no account needed to start.",
  },
  {
    Icon: InfoCircleIcon,
    title: "See your score and what moved it",
    body: "An explainable health score with the contributions that pushed it up or down — no black box.",
  },
  {
    Icon: BookmarkIcon,
    title: "Get evidence-cited picks with cheaper alternatives",
    body: "Each recommendation cites the study behind it and shows a budget-friendly brand if one meets the dose.",
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Container as="div" className="relative pt-24 pb-20 md:pt-32 md:pb-28">
          <HeroLeaf />
          <div className="relative max-w-2xl">
            <Eyebrow>VitaPath</Eyebrow>
            <h1 className="mt-5 font-serif text-5xl leading-[1.05] text-ink sm:text-6xl md:text-7xl">
              Vitamins built around your day —{" "}
              <span className="italic">not</span> a marketing funnel.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-soft sm:text-xl">
              A short quiz, an explainable score, and supplement picks cited
              against real evidence — with safety flags before they collide
              with your medications.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/quiz/1"
                className={buttonClasses("primary", "lg")}
              >
                Start the quiz
              </Link>
              <Link
                href="#how"
                className={buttonClasses("secondary", "lg")}
              >
                How it works
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section id="how" className="bg-surface-sage/40 py-20 md:py-28">
        <Container>
          <Eyebrow>How it works</Eyebrow>
          <SectionHeading className="mt-3">
            Three steps. About two minutes.
          </SectionHeading>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {HOW_STEPS.map(({ Icon, title, body }, i) => (
              <li key={title}>
                <Card tone="sage" className="h-full">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex size-9 items-center justify-center rounded-pill bg-sage text-white"
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="font-serif text-sm font-medium text-ink-muted">
                      Step {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-serif text-xl leading-snug text-ink">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-ink-soft">{body}</p>
                </Card>
              </li>
            ))}
          </ol>
          <p className="mt-12 max-w-xl text-sm text-ink-soft">
            VitaPath is a coursework project, not medical advice. Results are
            general dietary guidance — please talk to a clinician before
            starting, stopping, or combining any supplement.
          </p>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-10">
        <Container>
          <p className="text-center text-xs text-ink-muted">
            VitaPath · AUM AI Agentic capstone, Spring 2026 ·{" "}
            <a
              href="https://github.com/SDulguun/Vitapath"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              source on GitHub
            </a>
          </p>
        </Container>
      </footer>
    </main>
  );
}
