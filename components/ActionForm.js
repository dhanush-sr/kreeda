"use client";

import { useActionState } from "react";

export default function ActionForm({ action, hidden = {}, className = "", children, compact = false }) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v ?? ""} />
      ))}
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {state?.message && (
        <p
          className={`${compact ? "mt-1 text-xs" : "mt-3 rounded-lg border px-3 py-2 text-sm"} ${
            state.ok
              ? compact
                ? "text-primary"
                : "border-secondary-container bg-secondary-container/40 text-on-secondary-fixed-variant"
              : compact
              ? "text-error"
              : "border-red-200 bg-error-container/40 text-on-error-container"
          }`}
          role="status"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
