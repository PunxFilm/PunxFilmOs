"use client";

interface Step {
  num: number;
  title: string;
}

export function ImportWizardStepper({
  steps,
  current,
}: {
  steps: Step[];
  current: number;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {steps.map((s, i) => {
        const isCurrent = s.num === current;
        const isDone = s.num < current;
        return (
          <div key={s.num} className="flex items-center gap-3">
            {i > 0 && (
              <div
                className="h-px w-8"
                style={{
                  background: isDone ? "var(--accent)" : "var(--border)",
                }}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold"
                style={{
                  background: isCurrent
                    ? "var(--accent)"
                    : isDone
                      ? "var(--accent)"
                      : "var(--card-2)",
                  color:
                    isCurrent || isDone ? "white" : "var(--fg-3)",
                  border: `1px solid ${isCurrent || isDone ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                {isDone ? "\u2713" : s.num}
              </div>
              <span
                className="text-[13px]"
                style={{
                  color: isCurrent
                    ? "var(--fg)"
                    : isDone
                      ? "var(--fg-2)"
                      : "var(--fg-3)",
                  fontWeight: isCurrent ? 600 : 500,
                }}
              >
                {s.title}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
