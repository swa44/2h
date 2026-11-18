type P = { className?: string };
const base = "w-6 h-6";
const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const HomeIcon = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>
);
export const CalendarIcon = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}><rect x="3" y="4.5" width="18" height="16.5" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></svg>
);
export const PenIcon = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></svg>
);
export const GearIcon = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
);
export const HeartIcon = ({ className = base, filled = false }: P & { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" className={className} {...s} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20s-7-4.3-9-8.6C1.6 8.2 3.6 4.5 7.1 4.5c2 0 3.4 1 4.9 2.8 1.5-1.8 2.9-2.8 4.9-2.8 3.5 0 5.5 3.7 4.1 6.9C19 15.7 12 20 12 20z" />
  </svg>
);
export const ChevronLeft = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}><path d="m15 18-6-6 6-6" /></svg>
);
export const ChevronRight = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}><path d="m9 18 6-6-6-6" /></svg>
);
export const PinIcon = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);
export const ImageIcon = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.8" /><path d="m21 15-5-5L5 21" /></svg>
);
export const XIcon = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const PlusIcon = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}><path d="M12 5v14M5 12h14" /></svg>
);
