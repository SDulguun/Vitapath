import {
  BackButton,
  Button,
  Card,
  Container,
  Eyebrow,
  PageHeading,
} from "@/app/_components";
import { acceptDisclaimer } from "./actions";

export const dynamic = "force-dynamic";

export default async function DisclaimerPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/quiz/1";

  return (
    <main className="flex min-h-screen items-center py-16 md:py-24">
      <Container as="section" className="max-w-xl">
        <div className="mb-6 -ml-2">
          <BackButton href="/">Back to home</BackButton>
        </div>
        <Eyebrow>VitaPath</Eyebrow>
        <PageHeading className="mt-3">Before you start</PageHeading>

        <Card
          tone="sage"
          data-testid="disclaimer-body"
          className="mt-8 space-y-4 text-sm text-ink-soft sm:text-base"
        >
          <p>
            VitaPath is a coursework project that produces general dietary
            guidance. It is{" "}
            <strong className="font-semibold text-ink">
              not medical advice
            </strong>
            , not a diagnosis, and not a substitute for talking to a clinician.
          </p>
          <p>
            Please consult a doctor or registered dietitian before starting,
            stopping, or combining any supplement. This matters most if you
            take prescription medication, have a medical condition, are
            pregnant, or are nursing.
          </p>
          <p>
            By continuing you acknowledge that you understand these limits and
            will not act on the recommendations without professional review.
          </p>
        </Card>

        <form action={acceptDisclaimer} className="mt-8">
          <input type="hidden" name="next" value={safeNext} />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            data-testid="disclaimer-accept"
            className="w-full sm:w-auto"
          >
            I understand, continue
          </Button>
        </form>
      </Container>
    </main>
  );
}
