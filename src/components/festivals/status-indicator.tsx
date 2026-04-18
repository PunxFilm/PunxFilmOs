interface StatusIndicatorProps {
  hasActivePlan: boolean;
  hasSubmission: boolean;
  submissionStatus?: string | null;
}

const SUBMISSION_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function StatusIndicator({
  hasActivePlan,
  hasSubmission,
  submissionStatus,
}: StatusIndicatorProps) {
  if (!hasActivePlan && !hasSubmission) {
    return <span className="text-xs text-[var(--muted-foreground)]">—</span>;
  }

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      {hasSubmission && (
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium w-fit ${
            submissionStatus === "accepted"
              ? "bg-emerald-100 text-emerald-800"
              : submissionStatus === "rejected"
                ? "bg-red-100 text-red-800"
                : "bg-sky-100 text-sky-800"
          }`}
        >
          ✓ {SUBMISSION_LABELS[submissionStatus || "submitted"] || "Inviato"}
        </span>
      )}
      {hasActivePlan && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 w-fit">
          📋 Pianificato
        </span>
      )}
    </div>
  );
}
