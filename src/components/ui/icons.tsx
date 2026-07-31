import type { SVGProps } from "react";

/**
 * One icon language for the whole product: 24px grid, 1.6 stroke, round caps and
 * joins, no fills. Written by hand rather than pulled from a library so nothing
 * mixes filled and outline styles, and so the bundle carries only the icons this
 * product actually uses.
 *
 * Icons are decorative by default. Where an icon carries the only meaning, the
 * calling component supplies the accessible name.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </Icon>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 6.5h10.5v10H2z" />
      <path d="M12.5 10h4l3 3.5v3h-7z" />
      <circle cx="6.5" cy="18.5" r="1.8" />
      <circle cx="16.5" cy="18.5" r="1.8" />
      <path d="M8.3 18.5h6.4" />
    </Icon>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15 12 21 12 21Z" />
      <circle cx="12" cy="10" r="2.4" />
    </Icon>
  );
}

export function RouteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="5.5" cy="18" r="2.5" />
      <circle cx="18.5" cy="6" r="2.5" />
      <path d="M8 18h5.5a3.5 3.5 0 0 0 0-7H10a3.5 3.5 0 0 1 0-5h6" strokeDasharray="0 0" />
    </Icon>
  );
}

export function BoxIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.5 7.8v8.4a1.5 1.5 0 0 1-.8 1.3l-7 3.6a1.5 1.5 0 0 1-1.4 0l-7-3.6a1.5 1.5 0 0 1-.8-1.3V7.8" />
      <path d="M3.5 7.8 12 3.4l8.5 4.4L12 12.2 3.5 7.8Z" />
      <path d="M12 12.2V21" />
    </Icon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.2 19 6v5.5c0 4.3-2.9 7.5-7 9.3-4.1-1.8-7-5-7-9.3V6l7-2.8Z" />
      <path d="m9.2 12.2 2 2 3.6-3.8" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8.5 3.5v3.5M15.5 3.5v3.5" />
    </Icon>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="9" width="11.5" height="11.5" rx="2" />
      <path d="M6.5 15H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5h8.5A1.5 1.5 0 0 1 15 5v1.5" />
    </Icon>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5v11" />
      <path d="m8.5 7 3.5-3.5L15.5 7" />
      <path d="M6 12.5H5A1.5 1.5 0 0 0 3.5 14v5A1.5 1.5 0 0 0 5 20.5h14a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 19 12.5h-1" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Icon>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.3 12.2 2.4 2.4 4.9-5.1" />
    </Icon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4.5 21 19.5H3L12 4.5Z" />
      <path d="M12 10v3.6M12 16.6v.4" />
    </Icon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11.2v4.6M12 8.2v.4" />
    </Icon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 12h15" />
      <path d="m14 6.5 5.5 5.5L14 17.5" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9.5 6 6 6-6 6" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m14.5 6-6 6 6 6" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
    </Icon>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.8 7 7.3 5.4a1.5 1.5 0 0 0 1.8 0L20.2 7" />
    </Icon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 19.5h4l10-10a2.1 2.1 0 0 0-3-3l-10 10v3Z" />
      <path d="m14.5 6.5 3 3" />
    </Icon>
  );
}

export function ArchiveIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="4.5" width="17" height="4" rx="1.2" />
      <path d="M5 8.5v10A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-10" />
      <path d="M10 12.5h4" />
    </Icon>
  );
}

export function RestoreIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 11a7.5 7.5 0 1 1 2.3 5.4" />
      <path d="M4 6.5V11h4.5" />
    </Icon>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </Icon>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12M4 6.5h.4M4 12h.4M4 17.5h.4" />
    </Icon>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 4.5H18A1.5 1.5 0 0 1 19.5 6v12a1.5 1.5 0 0 1-1.5 1.5h-3.5" />
      <path d="M11 8.5 14.5 12 11 15.5M14 12H4.5" />
    </Icon>
  );
}

export function SupportIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.8a2.5 2.5 0 1 1 3.6 2.3c-.7.4-1.2 1-1.2 1.8v.3M12 17.2v.3" />
    </Icon>
  );
}

export function SpinnerIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" />
    </Icon>
  );
}

export function PlaneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.5 19.5 12 21l1.6-4.3 4.6-1.4-1-6.6 2.7-2.7a1.7 1.7 0 0 0-2.4-2.4l-2.7 2.7-6.6-1L6.8 9.9 2.5 11.5 4 13" />
      <path d="m4 13 5.5 1.5L11 20" />
    </Icon>
  );
}

export function StarIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Icon fill={filled ? "currentColor" : "none"} {...props}>
      <path d="m12 4 2.5 5.1 5.6.8-4 4 .9 5.6L12 16.9 7 19.5l1-5.6-4.1-4 5.6-.8L12 4Z" />
    </Icon>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.2 2.4 3.3 5.4 3.3 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.3-5.4-3.3-8.5S9.8 5.9 12 3.5Z" />
    </Icon>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 20.5V5a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 13.5 5v15.5" />
      <path d="M13.5 10H18a1.5 1.5 0 0 1 1.5 1.5v9M3 20.5h18M7.5 7.5h3M7.5 11h3M7.5 14.5h3M16 14.5h1M16 17.5h1" />
    </Icon>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.6" />
    </Icon>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 4c-9 0-15 3.5-15 10a5 5 0 0 0 8.6 3.5C17 14 19 10 20 4Z" />
      <path d="M5 20c1.5-4.5 4.5-8 9-10" />
    </Icon>
  );
}

export function ScaleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4v16M7 20h10M12 6.5 5 9M12 6.5 19 9" />
      <path d="M2.5 14 5 9l2.5 5a2.5 2.5 0 0 1-5 0ZM16.5 14 19 9l2.5 5a2.5 2.5 0 0 1-5 0Z" />
    </Icon>
  );
}

export function CustomsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20.5h16M5.5 20.5V10M18.5 20.5V10M3 10h18L12 4 3 10Z" />
      <path d="M9 20.5V14h6v6.5" />
    </Icon>
  );
}
