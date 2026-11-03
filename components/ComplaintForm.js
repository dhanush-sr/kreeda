"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { raiseComplaint, similarComplaints } from "@/app/actions/member";
import { Badge, Icon, buttonClass, ghostButtonClass, inputClass } from "./ui";

export default function ComplaintForm({ courts, equipment }) {
  const [state, action, pending] = useActionState(raiseComplaint, null);
  const [text, setText] = useState("");
  const [target, setTarget] = useState(`court:${courts[0].court_id}`);
  const [similar, setSimilar] = useState([]);
  const [checking, setChecking] = useState(false);
  const form = useRef(null);
  const dup = useRef(null);

  useEffect(() => {
    if (text.trim().length < 12) {
      setSimilar([]);
      return;
    }
    setChecking(true);
    const t = setTimeout(async () => {
      setSimilar(await similarComplaints(text, target));
      setChecking(false);
    }, 600);
    return () => clearTimeout(t);
  }, [text, target]);

  useEffect(() => {
    if (state?.ok) {
      setText("");
      setSimilar([]);
    }
  }, [state]);

  function sameProblem(id) {
    dup.current.value = id;
    form.current.requestSubmit();
  }

  return (
    <form ref={form} action={action} className="flex flex-col gap-4">
      <input ref={dup} type="hidden" name="duplicate_of" defaultValue="" />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">What is it about?</span>
        <select name="target" value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass}>
          <optgroup label="Courts">
            {courts.map((c) => (
              <option key={c.court_id} value={`court:${c.court_id}`}>{c.name}</option>
            ))}
          </optgroup>
          <optgroup label="Equipment">
            {equipment.map((e) => (
              <option key={e.equipment_id} value={`equipment:${e.equipment_id}`}>{e.name}</option>
            ))}
          </optgroup>
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Describe the problem</span>
        <textarea
          name="complaint_text"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={inputClass}
          placeholder="e.g. the net on court 2 has a big hole in it"
          required
          minLength={10}
        />
      </label>

      {(checking || similar.length > 0) && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-900">
            <Icon name="auto_awesome" className="text-[18px]" /> {checking ? "Checking for similar complaints…" : "Looks similar to existing complaints"}
          </p>
          <div className="space-y-2">
            {similar.map((s) => (
              <div key={s.complaint_id} className="flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-white p-3">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge tone={s.score >= 74 ? "dark" : "amber"}>{s.score}% similar</Badge>
                    <span className="text-xs font-semibold text-on-surface-variant">{s.target}</span>
                    <span className="text-xs text-outline">reported by {s.reports} {s.reports === 1 ? "person" : "people"}</span>
                  </div>
                  <p className="text-sm">{s.complaint_text}</p>
                </div>
                <button type="button" disabled={pending} onClick={() => sameProblem(s.complaint_id)} className={`${ghostButtonClass} shrink-0`}>
                  Same problem, add my report
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className={buttonClass} disabled={pending} onClick={() => (dup.current.value = "")}>
        <Icon name="send" /> Submit as a new complaint
      </button>
      {state?.message && (
        <p className={`rounded-lg border px-3 py-2 text-sm ${state.ok ? "border-secondary-container bg-secondary-container/40 text-on-secondary-fixed-variant" : "border-red-200 bg-error-container/40 text-on-error-container"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
