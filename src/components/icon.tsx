import type { CSSProperties, ReactNode } from "react";

export type IconName =
  | "dash" | "film" | "festival" | "strategy" | "submit" | "task" | "money"
  | "calendar" | "team" | "import" | "bell" | "settings" | "search" | "plus"
  | "chev" | "chevD" | "arrow" | "close" | "ext" | "dot" | "star" | "starO"
  | "check" | "fire" | "spark" | "filter" | "sun" | "moon" | "eye" | "mail"
  | "link" | "more" | "globe" | "pin" | "clock" | "trend" | "download" | "up"
  | "down" | "grip" | "grid" | "list" | "kanban" | "help" | "trophy";

interface IconProps {
  name: IconName;
  size?: number;
  style?: CSSProperties;
  className?: string;
}

export function Icon({ name, size = 14, style, className }: IconProps) {
  const s: CSSProperties = {
    width: size,
    height: size,
    display: "inline-block",
    flexShrink: 0,
    ...style,
  };
  const stroke = {
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<IconName, ReactNode> = {
    dash: (
      <>
        <rect x="3" y="3" width="7" height="9" rx="1" {...stroke} />
        <rect x="14" y="3" width="7" height="5" rx="1" {...stroke} />
        <rect x="14" y="12" width="7" height="9" rx="1" {...stroke} />
        <rect x="3" y="16" width="7" height="5" rx="1" {...stroke} />
      </>
    ),
    film: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="1" {...stroke} />
        <path d="M7 4v16M17 4v16M3 8h4M17 8h4M3 12h4M17 12h4M3 16h4M17 16h4" {...stroke} />
      </>
    ),
    festival: (
      <>
        <path d="M3 9l9-5 9 5v11H3z" {...stroke} />
        <path d="M9 20v-6h6v6" {...stroke} />
      </>
    ),
    strategy: (
      <>
        <circle cx="6" cy="18" r="2.5" {...stroke} />
        <circle cx="18" cy="6" r="2.5" {...stroke} />
        <circle cx="18" cy="18" r="2.5" {...stroke} />
        <path d="M8 18h7M18 8v8M16 7l-8 9" {...stroke} />
      </>
    ),
    submit: (
      <>
        <path d="M4 4h12l4 4v12H4z" {...stroke} />
        <path d="M8 4v6h6" {...stroke} />
        <path d="M9 14l3 3 3-3M12 11v6" {...stroke} />
      </>
    ),
    task: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="1" {...stroke} />
        <path d="M8 10l3 3 5-6" {...stroke} />
      </>
    ),
    money: (
      <>
        <circle cx="12" cy="12" r="9" {...stroke} />
        <path d="M12 6v12M15 9c-.5-1.3-1.8-2-3.2-2-1.6 0-3 .9-3 2.3s1.4 2 3 2.3c1.6.3 3 .9 3 2.3s-1.4 2.3-3 2.3c-1.4 0-2.7-.7-3.2-2" {...stroke} />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="1" {...stroke} />
        <path d="M3 10h18M8 3v4M16 3v4" {...stroke} />
      </>
    ),
    team: (
      <>
        <circle cx="9" cy="8" r="3" {...stroke} />
        <circle cx="17" cy="9" r="2.5" {...stroke} />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 15c1-.6 2.1-1 3-1 2.2 0 4 1.8 4 4" {...stroke} />
      </>
    ),
    import: <path d="M12 3v12M7 10l5 5 5-5M4 21h16" {...stroke} />,
    bell: (
      <>
        <path d="M6 16V10a6 6 0 0112 0v6l2 2H4z" {...stroke} />
        <path d="M10 20a2 2 0 004 0" {...stroke} />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" {...stroke} />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" {...stroke} />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" {...stroke} />
        <path d="M20 20l-4-4" {...stroke} />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" {...stroke} />,
    chev: <path d="M9 6l6 6-6 6" {...stroke} />,
    chevD: <path d="M6 9l6 6 6-6" {...stroke} />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" {...stroke} />,
    close: <path d="M6 6l12 12M18 6L6 18" {...stroke} />,
    ext: <path d="M14 4h6v6M20 4l-8 8M18 14v5H5V6h5" {...stroke} />,
    dot: <circle cx="12" cy="12" r="2" fill="currentColor" />,
    star: (
      <path
        d="M12 3l2.7 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.5l-5.6 2.9 1.1-6.3L2.9 9.7l6.3-.9z"
        fill="currentColor"
        stroke="none"
      />
    ),
    starO: (
      <path
        d="M12 3l2.7 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.5l-5.6 2.9 1.1-6.3L2.9 9.7l6.3-.9z"
        {...stroke}
      />
    ),
    check: <path d="M4 12l5 5L20 6" {...stroke} />,
    fire: (
      <path
        d="M12 2s1 3 3 5c3 3 4 6 4 9a7 7 0 01-14 0c0-2 1-4 3-5 0 2 1 3 2 3-1-3 0-7 2-12z"
        {...stroke}
      />
    ),
    spark: (
      <path
        d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"
        {...stroke}
      />
    ),
    filter: <path d="M3 5h18l-7 9v5l-4 2v-7z" {...stroke} />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" {...stroke} />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" {...stroke} />
      </>
    ),
    moon: <path d="M20 14A8 8 0 119 3a7 7 0 0011 11z" {...stroke} />,
    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" {...stroke} />
        <circle cx="12" cy="12" r="3" {...stroke} />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="1" {...stroke} />
        <path d="M3 7l9 7 9-7" {...stroke} />
      </>
    ),
    link: (
      <>
        <path d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1" {...stroke} />
        <path d="M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1" {...stroke} />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1.3" fill="currentColor" />
        <circle cx="12" cy="12" r="1.3" fill="currentColor" />
        <circle cx="19" cy="12" r="1.3" fill="currentColor" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" {...stroke} />
        <path d="M3 12h18M12 3c3 3 4.5 6 4.5 9S15 21 12 21s-4.5-3-4.5-9S9 6 12 3z" {...stroke} />
      </>
    ),
    pin: (
      <>
        <path d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" {...stroke} />
        <circle cx="12" cy="10" r="2.5" {...stroke} />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" {...stroke} />
        <path d="M12 7v5l3 2" {...stroke} />
      </>
    ),
    trend: <path d="M3 17l6-6 4 4 8-8M14 7h7v7" {...stroke} />,
    download: <path d="M12 3v13M6 11l6 6 6-6M4 21h16" {...stroke} />,
    up: <path d="M6 15l6-6 6 6" {...stroke} />,
    down: <path d="M6 9l6 6 6-6" {...stroke} />,
    grip: (
      <>
        <circle cx="9" cy="6" r="1" fill="currentColor" />
        <circle cx="15" cy="6" r="1" fill="currentColor" />
        <circle cx="9" cy="12" r="1" fill="currentColor" />
        <circle cx="15" cy="12" r="1" fill="currentColor" />
        <circle cx="9" cy="18" r="1" fill="currentColor" />
        <circle cx="15" cy="18" r="1" fill="currentColor" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" {...stroke} />
        <rect x="14" y="3" width="7" height="7" rx="1" {...stroke} />
        <rect x="3" y="14" width="7" height="7" rx="1" {...stroke} />
        <rect x="14" y="14" width="7" height="7" rx="1" {...stroke} />
      </>
    ),
    list: <path d="M4 6h16M4 12h16M4 18h16" {...stroke} />,
    kanban: (
      <>
        <rect x="3" y="4" width="5" height="16" rx="1" {...stroke} />
        <rect x="10" y="4" width="5" height="10" rx="1" {...stroke} />
        <rect x="17" y="4" width="4" height="13" rx="1" {...stroke} />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" {...stroke} />
        <path d="M9.5 9a2.5 2.5 0 015 0c0 1.7-2.5 2-2.5 4" {...stroke} />
        <circle cx="12" cy="17" r="0.7" fill="currentColor" />
      </>
    ),
    trophy: (
      <path d="M7 4h10v4a5 5 0 01-10 0zM3 6h4M17 6h4M9 14h6l-1 6h-4z" {...stroke} />
    ),
  };

  return (
    <svg viewBox="0 0 24 24" style={s} className={className}>
      {paths[name] ?? null}
    </svg>
  );
}
