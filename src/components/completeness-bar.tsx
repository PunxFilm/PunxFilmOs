import { getCompletenessColor } from "@/lib/completeness";

interface CompletenessBarProps {
  score: number; // 0-100
  size?: "sm" | "md";
  showLabel?: boolean;
  missingFields?: string[];
  className?: string;
}

export function CompletenessBar({
  score,
  size = "md",
  showLabel = true,
  missingFields,
  className = "",
}: CompletenessBarProps) {
  const color = getCompletenessColor(score);
  const barColor =
    color === "emerald" ? "bg-emerald-500" : color === "amber" ? "bg-amber-500" : "bg-red-500";
  const textColor =
    color === "emerald" ? "text-emerald-700" : color === "amber" ? "text-amber-700" : "text-red-700";
  const barHeight = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className={`group relative ${className}`}>
      <div className="flex items-center gap-2">
        <div className={`flex-1 ${barHeight} rounded-full bg-[var(--muted)] overflow-hidden`}>
          <div
            className={`${barHeight} rounded-full ${barColor} transition-all`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
        {showLabel && (
          <span className={`text-xs font-medium ${textColor} whitespace-nowrap`}>
            {Math.round(score)}%
          </span>
        )}
      </div>
      {/* Tooltip with missing fields */}
      {missingFields && missingFields.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-50">
          <div className="bg-[var(--foreground)] text-[var(--background)] text-xs rounded-lg px-3 py-2 max-w-xs shadow-lg">
            <p className="font-medium mb-1">Campi mancanti:</p>
            <ul className="space-y-0.5">
              {missingFields.slice(0, 10).map((f) => (
                <li key={f}>- {f}</li>
              ))}
              {missingFields.length > 10 && (
                <li className="opacity-70">...e altri {missingFields.length - 10}</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
