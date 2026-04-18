interface QualifyingBadgesProps {
  oscar?: boolean;
  bafta?: boolean;
  efa?: boolean;
  goya?: boolean;
  size?: "sm" | "md";
}

const BADGE_STYLES = {
  oscar: {
    short: "OSC",
    long: "Oscar",
    className: "bg-rose-100 text-rose-900 border-rose-300",
  },
  bafta: {
    short: "BAF",
    long: "BAFTA",
    className: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  efa: {
    short: "EFA",
    long: "EFA",
    className: "bg-sky-100 text-sky-900 border-sky-300",
  },
  goya: {
    short: "GOY",
    long: "Goya",
    className: "bg-amber-100 text-amber-900 border-amber-300",
  },
} as const;

export function QualifyingBadges({
  oscar,
  bafta,
  efa,
  goya,
  size = "sm",
}: QualifyingBadgesProps) {
  const items: Array<keyof typeof BADGE_STYLES> = [];
  if (oscar) items.push("oscar");
  if (bafta) items.push("bafta");
  if (efa) items.push("efa");
  if (goya) items.push("goya");

  if (items.length === 0) return null;

  return (
    <span className="inline-flex items-center gap-1">
      {items.map((key) => {
        const s = BADGE_STYLES[key];
        return (
          <span
            key={key}
            title={`${s.long} qualifying`}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[10px] font-bold tracking-wide ${s.className}`}
          >
            🏆{size === "md" ? s.long : s.short}
          </span>
        );
      })}
    </span>
  );
}
