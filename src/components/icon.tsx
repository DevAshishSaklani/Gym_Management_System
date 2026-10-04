import type { ReactNode } from "react";

const P = (d: string) => <path key={d} d={d} />;

/* Line icons (24px grid). Keys include the emoji the app used before, so existing
   `icon="💳"` props keep working and now render as crisp SVG. */
const paths: Record<string, ReactNode[]> = {
  "🏠": [P("M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z")],
  "👥": [P("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"), <circle key="c" cx="9" cy="7" r="4" />, P("M22 21v-2a4 4 0 0 0-3-3.87"), P("M16 3.13a4 4 0 0 1 0 7.75")],
  "👤": [P("M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"), <circle key="c" cx="12" cy="7" r="4" />],
  "💳": [<rect key="r" x="2" y="5" width="20" height="14" rx="2" />, P("M2 10h20")],
  "✅": [P("M22 11.08V12a10 10 0 1 1-5.93-9.14"), P("m9 11 3 3L22 4")],
  "🎫": [P("M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"), P("M13 5v2"), P("M13 11v2"), P("M13 17v2")],
  "🧑‍🏫": [P("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"), <circle key="c" cx="9" cy="7" r="4" />, P("m16 11 2 2 4-4")],
  "📋": [<rect key="r" x="8" y="2" width="8" height="4" rx="1" />, P("M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2")],
  "📊": [P("M3 3v18h18"), P("M18 17V9"), P("M13 17V5"), P("M8 17v-3")],
  "🔔": [P("M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"), P("M10.3 21a1.94 1.94 0 0 0 3.4 0")],
  "🏋️": [P("M6.5 6.5v11"), P("M17.5 6.5v11"), P("M3.5 9v6"), P("M20.5 9v6"), P("M6.5 12h11")],
  "💪": [P("M13 2 3 14h9l-1 8 10-12h-9l1-8z")],
  "📈": [P("m22 7-8.5 8.5-5-5L2 17"), P("M16 7h6v6")],
  "⏰": [<circle key="c" cx="12" cy="12" r="10" />, P("M12 6v6l4 2")],
  "⏳": [<circle key="c" cx="12" cy="12" r="10" />, P("M12 6v6l4 2")],
  "💰": [P("M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"), P("M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4")],
  "⚠️": [P("m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"), P("M12 9v4"), P("M12 17h.01")],
  "📅": [<rect key="r" x="3" y="4" width="18" height="18" rx="2" />, P("M16 2v4"), P("M8 2v4"), P("M3 10h18")],
  "🗓️": [<rect key="r" x="3" y="4" width="18" height="18" rx="2" />, P("M16 2v4"), P("M8 2v4"), P("M3 10h18")],
  "🤝": [P("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"), <circle key="c" cx="9" cy="7" r="4" />, P("M19 8v6"), P("M22 11h-6")],
  logout: [P("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"), P("m16 17 5-5-5-5"), P("M21 12H9")],
  menu: [P("M4 6h16"), P("M4 12h16"), P("M4 18h16")],
  more: [<circle key="a" cx="5" cy="12" r="1" />, <circle key="b" cx="12" cy="12" r="1" />, <circle key="c" cx="19" cy="12" r="1" />],
  close: [P("M18 6 6 18"), P("m6 6 12 12")],
  sun: [<circle key="c" cx="12" cy="12" r="4" />, P("M12 2v2"), P("M12 20v2"), P("m4.93 4.93 1.41 1.41"), P("m17.66 17.66 1.41 1.41"), P("M2 12h2"), P("M20 12h2"), P("m6.34 17.66-1.41 1.41"), P("m19.07 4.93-1.41 1.41")],
  moon: [P("M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z")],
};

export default function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const shapes = paths[name];
  if (!shapes) return <span className={className}>{name}</span>;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {shapes}
    </svg>
  );
}
