"use client";

import { useState, useTransition } from "react";
import {
  BackButton,
  Button,
  Card,
  CheckCircleIcon,
  Container,
  EnvelopeIcon,
  Eyebrow,
  Field,
  Spinner,
} from "@/app/_components";
import { signIn, type SignInState } from "./actions";

/* The sign-in page used to be a bare stone-bordered form. v2 §2.3 promotes
   it to the same editorial standard as the rest of the redesign: a sage
   Card with the Envelope icon doing a gentle idle bob, big serif "Welcome
   back." heading, a pill-shaped email field, and a success card that fades
   in once the magic link is dispatched.

   State model: dropped useActionState in favor of useState + useTransition
   so we can locally reset the success state when the user clicks "send
   another link" — useActionState's state outlives a key change and offers
   no reset hook. */

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      disabled={pending}
      className="w-full"
      data-testid="login-submit"
    >
      {pending ? (
        <>
          <Spinner className="size-4 text-white" />
          Sending
        </>
      ) : (
        "Send sign-in link"
      )}
    </Button>
  );
}

export default function LoginPage() {
  const [state, setState] = useState<SignInState>({});
  const [pending, startTransition] = useTransition();

  function action(formData: FormData) {
    startTransition(async () => {
      const result = await signIn({}, formData);
      setState(result);
    });
  }

  function resetForm() {
    setState({});
  }

  const showSuccess = state.sent === true;

  return (
    <main className="flex min-h-[80vh] items-center py-12 md:py-16">
      <Container as="section" className="max-w-md">
        <Card
          tone="sage"
          className="space-y-6 rounded-xl p-8 shadow-md sm:p-10"
        >
          {showSuccess ? (
            <SuccessState email={state.email} onTryAgain={resetForm} />
          ) : (
            <IdleState
              error={state.error}
              pending={pending}
              action={action}
            />
          )}
        </Card>
      </Container>
    </main>
  );
}

function IdleState({
  error,
  pending,
  action,
}: {
  error?: string;
  pending: boolean;
  action: (formData: FormData) => void;
}) {
  return (
    <>
      <div className="flex flex-col items-center">
        <EnvelopeIcon
          className="vp-envelope-bob size-11 text-sage"
          aria-hidden
        />
        <Eyebrow className="mt-5">VitaPath</Eyebrow>
        <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">
          Welcome back.
        </h1>
        <p className="mt-3 max-w-sm text-center text-base text-ink-soft sm:text-[17px]">
          Enter your email and we&apos;ll send a one-time sign-in link. No
          password to remember.
        </p>
      </div>

      <form action={action} className="space-y-5" data-testid="login-form">
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="block h-13 w-full rounded-pill border border-sage-soft bg-surface px-5 text-base text-ink placeholder:text-ink-muted/70 transition-colors duration-fast ease-out-soft focus:border-sage focus:outline-2 focus:outline-offset-2 focus:outline-sage"
          />
        </Field>
        {error && (
          <p
            role="alert"
            data-testid="login-error"
            className="rounded-pill bg-rose-soft px-4 py-2 text-center text-sm text-rose"
          >
            {error}
          </p>
        )}
        <SubmitButton pending={pending} />
      </form>

      <div className="flex justify-center pt-1">
        <BackButton href="/">Back to home</BackButton>
      </div>
    </>
  );
}

function SuccessState({
  email,
  onTryAgain,
}: {
  email?: string;
  onTryAgain: () => void;
}) {
  return (
    <div
      data-testid="login-sent"
      className="vp-fade-in flex flex-col items-center space-y-4 text-center"
    >
      <CheckCircleIcon
        className="size-8 text-sage"
        aria-hidden
      />
      <div>
        <h2 className="font-serif text-3xl text-ink">Check your email.</h2>
        <p className="mt-3 text-base text-ink-soft sm:text-[17px]">
          We sent a sign-in link to{" "}
          <span className="font-medium text-ink">{email ?? "your inbox"}</span>
          . It expires in 60 minutes.
        </p>
      </div>
      <p className="text-sm text-ink-muted">
        Can&apos;t find it? Look in your spam folder, or{" "}
        <button
          type="button"
          onClick={onTryAgain}
          data-testid="login-resend"
          className="rounded-sm font-medium text-sage-deep underline decoration-sage decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-fast hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
        >
          send another link
        </button>
        .
      </p>
      <p className="max-w-sm text-xs text-ink-muted">
        Open the link on the same device you signed in from for the
        smoothest experience.
      </p>
    </div>
  );
}
