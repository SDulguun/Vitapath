import { redirect } from "next/navigation";
import { TOTAL_STEPS } from "@/lib/quiz/schemas";
import { QuizStep } from "../_components/QuizStep";

export const dynamic = "force-dynamic";

export default async function QuizStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  const stepNum = Number(step);
  if (
    !Number.isInteger(stepNum) ||
    stepNum < 1 ||
    stepNum > TOTAL_STEPS
  ) {
    redirect("/quiz/1");
  }
  return <QuizStep step={stepNum} />;
}
