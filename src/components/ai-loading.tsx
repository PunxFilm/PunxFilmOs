export function AiLoading({ message = "Analisi AI in corso..." }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span className="text-sm text-[var(--muted-foreground)]">{message}</span>
    </div>
  );
}
