"use client";

export function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  required,
  placeholder,
  options,
  rows,
  error,
}: {
  label: string;
  name: string;
  type?: "text" | "number" | "date" | "select" | "textarea";
  value: string | number;
  onChange: (name: string, value: string | number) => void;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  error?: string;
}) {
  const baseClass = `w-full px-3 py-2 rounded-lg border bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] ${
    error ? "border-[var(--destructive)]" : "border-[var(--border)]"
  }`;

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required && <span className="text-[var(--accent)] ml-1">*</span>}
      </label>
      {type === "select" ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          required={required}
          className={baseClass}
        >
          <option value="">Seleziona...</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          required={required}
          placeholder={placeholder}
          rows={rows || 3}
          className={baseClass}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) =>
            onChange(
              name,
              type === "number" ? Number(e.target.value) : e.target.value
            )
          }
          required={required}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
      {error && (
        <p className="text-xs text-[var(--destructive)]">{error}</p>
      )}
    </div>
  );
}
