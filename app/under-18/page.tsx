import Link from "next/link";
import {
  buttonClasses,
  Card,
  Container,
  Eyebrow,
  PageHeading,
} from "@/app/_components";

export const dynamic = "force-static";

export default function Under18Page() {
  return (
    <main className="flex min-h-screen items-center py-16 md:py-24">
      <Container as="section" className="max-w-xl" data-testid="under-18-page">
        <Eyebrow>VitaPath</Eyebrow>
        <PageHeading className="mt-3">For people under 18</PageHeading>

        <Card tone="sage" className="mt-8 space-y-3 text-sm text-ink-soft sm:text-base">
          <p>
            Supplement needs in childhood and adolescence depend on growth,
            maturation, and pediatric drug interactions that this app
            intentionally does not model.
          </p>
          <p>
            Please talk to a pediatrician or registered dietitian. They can
            assess your specific situation safely.
          </p>
        </Card>

        <div className="mt-8">
          <Link href="/" className={buttonClasses("secondary", "md")}>
            Back to home
          </Link>
        </div>
      </Container>
    </main>
  );
}
