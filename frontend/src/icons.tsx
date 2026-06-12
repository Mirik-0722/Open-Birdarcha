// Yengil, chiziqli SVG ikonalar (stroke = currentColor).
type P = { size?: number; className?: string };
const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconSearch = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-3.8-3.8" />
  </svg>
);

export const IconBuilding = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="4" y="3" width="11" height="18" rx="1.5" />
    <path d="M15 8h4a1.5 1.5 0 0 1 1.5 1.5V21M8 7h3M8 11h3M8 15h3" />
  </svg>
);

export const IconUser = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);

export const IconUsers = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 19a6 6 0 0 1 12 0M16 6.5a3 3 0 0 1 0 5.8M21 19a6 6 0 0 0-4-5.6" />
  </svg>
);

export const IconCalendar = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3.5" y="5" width="17" height="16" rx="2" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </svg>
);

export const IconWallet = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="6" width="18" height="13" rx="2.5" />
    <path d="M3 10h18M16 14.5h2" />
  </svg>
);

export const IconPin = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const IconId = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <circle cx="8.5" cy="11" r="2" />
    <path d="M13 9.5h5M13 13h5M5.5 16a3 3 0 0 1 6 0" />
  </svg>
);

export const IconShield = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3l7 2.5V11c0 4.6-3 8-7 9.5C8 19 5 15.6 5 11V5.5L12 3Z" />
  </svg>
);

export const IconRoute = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="6" cy="18" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <path d="M8.5 18H14a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5" />
  </svg>
);

export const IconArrowDown = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);
