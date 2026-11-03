export function Icon({ name, className = "", filled = false }) {
  return <span className={`material-symbols-outlined ${filled ? "filled" : ""} ${className}`}>{name}</span>;
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Card({ title, icon, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-6 shadow-sm ${className}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-on-surface">
            {icon && <Icon name={icon} className="text-primary" />}
            {title}
          </h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const TONES = {
  green: "bg-secondary-container text-on-secondary-fixed-variant",
  grey: "bg-slate-100 text-slate-600",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-error-container text-on-error-container",
  blue: "bg-sky-100 text-sky-800",
  dark: "bg-primary text-on-primary",
};

export function Badge({ tone = "grey", children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Stat({ label, value, sub, icon, tone = "green" }) {
  const iconTone = { green: "bg-secondary-container text-primary", amber: "bg-amber-100 text-amber-700", red: "bg-error-container text-error", blue: "bg-sky-100 text-sky-700" }[tone];
  return (
    <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-on-surface-variant">{label}</p>
        {icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconTone}`}>
            <Icon name={icon} />
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-on-surface">{value}</p>
      {sub && <p className="mt-1 text-xs text-outline">{sub}</p>}
    </div>
  );
}

export function Progress({ value, tone = "primary" }) {
  const bar = tone === "amber" ? "bg-amber-500" : tone === "red" ? "bg-error" : "bg-primary";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Empty({ children }) {
  return <p className="rounded-xl border border-dashed border-outline-variant px-4 py-6 text-center text-sm text-outline">{children}</p>;
}

export const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-on-secondary-fixed-variant active:scale-[0.98] disabled:opacity-60";

export const ghostButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-50";

export const dangerButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-error transition hover:bg-error-container/50 disabled:opacity-50";

export function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-on-surface">{label}</span>
      {children}
      {hint && <span className="text-xs text-outline">{hint}</span>}
    </label>
  );
}
