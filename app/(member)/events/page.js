import { query } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { embed } from "@/lib/embed";
import { search } from "@/lib/qdrant";
import { registerEvent, unregisterEvent } from "@/app/actions/member";
import ActionForm from "@/components/ActionForm";
import { Badge, Icon, PageHeader, Progress, buttonClass, ghostButtonClass, inputClass } from "@/components/ui";
import { dayLabel, hourLabel } from "@/lib/format";

export default async function EventsPage({ searchParams }) {
  const user = await requireRole("MEMBER");
  const q = String((await searchParams).q ?? "").trim();
  const events = await query(
    `SELECT e.event_id, e.name, e.sport, e.start_date, e.end_date, e.capacity, e.description, e.end_date < CURRENT_DATE AS over,
            (SELECT count(*) FROM event_registration r WHERE r.event_id = e.event_id AND r.status = 'REGISTERED') AS registered,
            EXISTS (SELECT 1 FROM event_registration r WHERE r.event_id = e.event_id AND r.member_id = $1 AND r.status = 'REGISTERED') AS mine,
            (SELECT string_agg(DISTINCT c.name, ', ') FROM court_block b JOIN court c USING (court_id) WHERE b.event_id = e.event_id) AS courts,
            (SELECT min(b.start_time)::text || '|' || max(b.end_time)::text FROM court_block b WHERE b.event_id = e.event_id) AS hours
     FROM event e ORDER BY e.end_date < CURRENT_DATE, e.start_date`,
    [user.member_id]
  );

  let list = events.map((e) => ({ e, score: null }));
  if (q) {
    const hits = await search("events", await embed(q), { limit: 10 }).catch(() => []);
    list = hits.map((h) => ({ e: events.find((e) => e.event_id === h.id), score: Math.round(h.score * 100) })).filter((x) => x.e);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Events & Tournaments" subtitle="Tournaments block the courts they need, so you'll never turn up to a court that's taken by an event." />

      <form className="flex gap-3 rounded-2xl border border-outline-variant/70 bg-white p-4 shadow-sm">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input name="q" defaultValue={q} className={`${inputClass} pl-10`} placeholder="Describe what you want, e.g. beginner friendly, just for fun" />
        </div>
        <button className={buttonClass}>
          <Icon name="auto_awesome" /> Search by meaning
        </button>
        {q && (
          <a href="/events" className={ghostButtonClass}>
            Clear
          </a>
        )}
      </form>

      <div className="grid grid-cols-2 gap-6">
        {list.map(({ e, score }) => {
          const pct = Math.round((100 * e.registered) / e.capacity);
          const full = e.registered >= e.capacity;
          const [from, to] = e.hours ? e.hours.split("|") : [];
          return (
            <article key={e.event_id} className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${e.over ? "border-outline-variant/50 opacity-70" : "border-outline-variant/70"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge tone="green">{e.sport}</Badge>
                    {e.over && <Badge>Finished</Badge>}
                    {score != null && <Badge tone="dark"><Icon name="auto_awesome" className="text-[14px]" /> {score}% match</Badge>}
                  </div>
                  <h3 className="text-xl font-bold text-on-surface">{e.name}</h3>
                </div>
                <div className="rounded-xl bg-surface-container-low px-3 py-2 text-center">
                  <p className="text-[11px] font-bold uppercase text-outline">{dayLabel(e.start_date).split(" ")[0]}</p>
                  <p className="text-lg font-extrabold text-primary">{dayLabel(e.start_date).split(" ").slice(1).join(" ")}</p>
                </div>
              </div>
              <p className="mt-3 flex-1 text-sm text-on-surface-variant">{e.description}</p>
              {e.courts && (
                <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                  <Icon name="block" className="text-[16px]" /> Blocks {e.courts}, {hourLabel(from)} – {hourLabel(to)}
                  {e.end_date !== e.start_date ? `, ${dayLabel(e.start_date)} to ${dayLabel(e.end_date)}` : ""}
                </p>
              )}
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs font-semibold">
                  <span className="text-on-surface-variant">{e.registered} / {e.capacity} registered</span>
                  <span className={full ? "text-error" : "text-primary"}>{full ? "Full" : `${e.capacity - e.registered} spots left`}</span>
                </div>
                <Progress value={pct} tone={full ? "red" : pct > 75 ? "amber" : "primary"} />
              </div>
              <div className="mt-4">
                {e.over ? null : e.mine ? (
                  <ActionForm action={unregisterEvent} hidden={{ event_id: e.event_id }} compact className="flex items-center gap-3">
                    <Badge tone="dark"><Icon name="check" className="text-[14px]" /> Registered</Badge>
                    <button className={ghostButtonClass}>Withdraw</button>
                  </ActionForm>
                ) : (
                  <ActionForm action={registerEvent} hidden={{ event_id: e.event_id }} compact>
                    <button className={buttonClass} disabled={full}>{full ? "Full" : "Register"}</button>
                  </ActionForm>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
