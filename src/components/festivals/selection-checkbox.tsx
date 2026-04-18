"use client";

interface SelectionCheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel?: string;
  indeterminate?: boolean; // per "select all" header
}

export function SelectionCheckbox({
  checked,
  onChange,
  ariaLabel,
  indeterminate = false,
}: SelectionCheckboxProps) {
  return (
    <label
      className="inline-flex items-center cursor-pointer"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate && !checked;
        }}
        aria-label={ariaLabel}
        className="w-4 h-4 cursor-pointer rounded border-[var(--border)] accent-[var(--primary)]"
      />
    </label>
  );
}
