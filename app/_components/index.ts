// Barrel for the shared design-system primitives. Feature components
// (ScoreGauge, RecCard, WarningCallouts, EvidenceList, BudgetBar,
// ShareDialog) land in their own dedicated phases (5–9) and will be added
// here as they're built.

export { Container } from "./Container";
export { Eyebrow } from "./Eyebrow";
export { PageHeading, SectionHeading } from "./Headings";
export {
  Button,
  buttonClasses,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from "./Button";
export { Card, type CardTone } from "./Card";
export { Field, TextInput, Select } from "./Field";
export { ProgressBar } from "./ProgressBar";
export { Stepper } from "./Stepper";
export { Disclosure } from "./Disclosure";
export { ScoreGauge, type ScoreContribution } from "./ScoreGauge";
export { cx } from "./_cx";

export {
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  CheckIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  InfoCircleIcon,
  BookmarkIcon,
  ShareIcon,
  CopyIcon,
} from "./icons";
