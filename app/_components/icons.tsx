// Hand-rolled inline SVG icons. 1.5px stroke, rounded line caps, currentColor.
// Add new ones here rather than pulling in heroicons / lucide.
import type { SVGProps } from "react";

const baseProps: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const defaultClass = "size-5";

function Icon(props: SVGProps<SVGSVGElement>) {
  const { className, children, ...rest } = props;
  return (
    <svg
      {...baseProps}
      className={className ?? defaultClass}
      aria-hidden={rest["aria-label"] ? undefined : true}
      {...rest}
    >
      {children}
    </svg>
  );
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  );
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m15 6-6 6 6 6" />
    </Icon>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m5 12 5 5L20 7" />
    </Icon>
  );
}

export function AlertTriangleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 4 2.5 20h19L12 4Z" />
      <path d="M12 10v4" />
      <path d="M12 17.5h.01" />
    </Icon>
  );
}

export function AlertCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx={12} cy={12} r={9} />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </Icon>
  );
}

export function InfoCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx={12} cy={12} r={9} />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </Icon>
  );
}

export function BookmarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 4h12v17l-6-4-6 4Z" />
    </Icon>
  );
}

export function ShareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx={6} cy={12} r={2.5} />
      <circle cx={18} cy={6} r={2.5} />
      <circle cx={18} cy={18} r={2.5} />
      <path d="m8.2 11 7.6-3.5" />
      <path d="m8.2 13 7.6 3.5" />
    </Icon>
  );
}

export function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x={9} y={9} width={11} height={11} rx={2} />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </Icon>
  );
}

export function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx={12} cy={12} r={9} />
      <path d="m8 12 3 3 5-6" />
    </Icon>
  );
}

export function EnvelopeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x={3} y={5} width={18} height={14} rx={2} />
      <path d="m3 7 8.4 5.6a1.2 1.2 0 0 0 1.2 0L21 7" />
    </Icon>
  );
}

export function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <path d="m5.5 5.5 2.8 2.8" />
      <path d="m15.7 15.7 2.8 2.8" />
      <path d="m5.5 18.5 2.8-2.8" />
      <path d="m15.7 8.3 2.8-2.8" />
    </Icon>
  );
}

/** Decorative botanical: a sage sprig with a central stem and three paired
 *  leaves. Use as a section divider (§1.4) — keep small (size-4 / size-5)
 *  and `text-sage-soft` or `text-sage`. */
export function SprigIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 4v16" />
      <path d="M12 9c-2-.5-3.5-1.5-4-3.5 2 0 3.5 1 4 3.5Z" />
      <path d="M12 9c2-.5 3.5-1.5 4-3.5-2 0-3.5 1-4 3.5Z" />
      <path d="M12 14c-2-.5-3.5-1.5-4-3.5 2 0 3.5 1 4 3.5Z" />
      <path d="M12 14c2-.5 3.5-1.5 4-3.5-2 0-3.5 1-4 3.5Z" />
    </Icon>
  );
}
