"use client";

export function ReportViewer({ content, onClose }: { content: string; onClose: () => void }) {
  // Basic markdown rendering
  const renderMarkdown = (md: string) => {
    return md.split("\n").map((line, i) => {
      // Headers
      if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold mt-6 mb-2">{line.slice(2)}</h1>;
      if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-semibold mt-5 mb-2">{line.slice(3)}</h2>;
      if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold mt-4 mb-1">{line.slice(4)}</h3>;
      if (line.startsWith("#### ")) return <h4 key={i} className="text-base font-semibold mt-3 mb-1">{line.slice(5)}</h4>;
      // Horizontal rule
      if (line.startsWith("---")) return <hr key={i} className="my-4 border-[var(--border)]" />;
      // List items
      if (line.startsWith("- ")) return <li key={i} className="ml-4 list-disc">{formatInline(line.slice(2))}</li>;
      if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal">{formatInline(line.replace(/^\d+\.\s/, ""))}</li>;
      // Table rows (|...|...|)
      if (line.includes("|") && line.trim().startsWith("|")) {
        const cells = line.split("|").filter(c => c.trim()).map(c => c.trim());
        if (cells.every(c => /^[-:]+$/.test(c))) return null; // separator row
        return (
          <div key={i} className="flex text-sm border-b border-[var(--border)]">
            {cells.map((c, j) => (
              <div key={j} className="flex-1 px-2 py-1">{formatInline(c)}</div>
            ))}
          </div>
        );
      }
      // Empty line
      if (line.trim() === "") return <div key={i} className="h-2" />;
      // Regular paragraph
      return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>;
    });
  };

  // Inline formatting: **bold**, *italic*, `code`
  function formatInline(text: string) {
    return text.replace(/\*\*(.*?)\*\*/g, "$1");
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-10 overflow-auto">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="font-semibold">Report</h2>
          <button onClick={onClose} className="px-3 py-1 text-sm rounded-lg hover:bg-[var(--secondary)]">Chiudi</button>
        </div>
        <div className="p-6 overflow-auto">{renderMarkdown(content)}</div>
      </div>
    </div>
  );
}
