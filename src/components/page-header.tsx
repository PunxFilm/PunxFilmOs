import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  action,
  actions,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <div className="page-sub">{subtitle}</div>}
      </div>
      {(action || actions) && (
        <div className="page-head-actions">
          {actions}
          {action && (
            <Link href={action.href} className="btn accent">
              {action.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
