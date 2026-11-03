import { query } from "@/lib/db";
import { createEvent, addBlock } from "@/app/actions/admin";
import ActionForm from "@/components/ActionForm";
import { Badge, Card, Field, Icon, PageHeader, Progress, buttonClass, inputClass } from "@/components/ui";
import { dayLabel, hourLabel } from "@/lib/format";

export default async function AdminEvents() {
  const [courts, events, blocks] = await Promise.all([
    query("SELECT court_id, name, sport FROM court WHERE is_active ORDER BY court_id"),
    query(
      `SELECT e.event_id, e.name, e.sport, e.start_date, e.end_date, e.capacity, e.end_date < CURRENT_DATE AS over,
              (SELECT count(*) FROM event_registration r WHERE r.event_id = e.event_id AND r.status = 'REGISTERED') AS registered,
              (SELECT string_agg(DISTINCT c.name, ', ') FROM court_block b JOIN court c USING (court_id) WHERE b.event_id = e.event_id) AS courts
       FROM event e ORDER BY e.start_date DESC`
    ),
    query(
      `SELECT b.block_date, b.start_time, b.end_time, c.name AS court, COALESCE(e.name, b.reason) AS why, e.event_id IS NULL AS maintenance
       FROM court_block b JOIN court c USING (court_id) LEFT JOIN event e USING (event_id)
       WHERE b.block_date >= CURRENT_DATE ORDER BY b.block_date, b.start_time, c.name`
    ),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events & Court Blocks"
        subtitle="Creating an event blocks its courts in one transaction. A trigger cancels clashing bookings and notifies the members, and two blocks can never overlap on the same court."
      />
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2 space-y-6">
          <Card title="Create event" icon="add_circle">
            <ActionForm action={createEvent} className="flex flex-col gap-4">
              <Field label="Event name">
                <input name="name" className={inputClass} placeholder="Inter-Department Tennis Cup" required />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Sport">
                  <select name="sport" className={inputClass}>
                    <option>Badminton</option>
                    <option>Tennis</option>
                    <option>Basketball</option>
                  </select>
                </Field>
                <Field label="Capacity">
                  <input name="capacity" type="number" min="1" defaultValue="16" className={inputClass} required />
                </Field>
                <Field label="Start date">
                  <input name="start_date" type="date" className={inputClass} required />
                </Field>
                <Field label="End date">
                  <input name="end_date" type="date" className={inputClass} required />
                </Field>
              </div>
              <Field label="Description" hint="Members can search events by meaning, so describe the level and vibe.">
                <textarea name="description" rows={3} className={inputClass} placeholder="Friendly doubles for beginners, rackets provided" />
              </Field>
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <Icon name="block" className="text-[18px]" /> Block courts for this event
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {courts.map((c) => (
                    <label key={c.court_id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="courts" value={c.court_id} className="accent-[#005532]" /> {c.name}
                    </label>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Field label="From">
                    <input name="block_start" type="time" defaultValue="08:00" step="3600" className={inputClass} />
                  </Field>
                  <Field label="To">
                    <input name="block_end" type="time" defaultValue="12:00" step="3600" className={inputClass} />
                  </Field>
                </div>
                <p className="mt-2 text-xs text-amber-800">Any bookings in these slots will be cancelled and the members told why.</p>
              </div>
              <button className={buttonClass}>Create event</button>
            </ActionForm>
          </Card>

          <Card title="Block a court for maintenance" icon="construction">
            <ActionForm action={addBlock} className="grid grid-cols-2 gap-3">
              <Field label="Court">
                <select name="court_id" className={inputClass}>
                  {courts.map((c) => (
                    <option key={c.court_id} value={c.court_id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Date">
                <input name="block_date" type="date" className={inputClass} required />
              </Field>
              <Field label="From">
                <input name="start_time" type="time" defaultValue="06:00" step="3600" className={inputClass} />
              </Field>
              <Field label="To">
                <input name="end_time" type="time" defaultValue="09:00" step="3600" className={inputClass} />
              </Field>
              <div className="col-span-2">
                <Field label="Reason">
                  <input name="reason" className={inputClass} placeholder="Net replacement" />
                </Field>
              </div>
              <button className={`${buttonClass} col-span-2`}>Block court</button>
            </ActionForm>
          </Card>
        </div>

        <div className="col-span-3 space-y-6">
          <Card title="Events" icon="emoji_events">
            <div className="space-y-3">
              {events.map((e) => (
                <div key={e.event_id} className={`rounded-xl border border-outline-variant/70 p-4 ${e.over ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{e.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {e.sport} · {dayLabel(e.start_date)}
                        {e.end_date !== e.start_date ? ` – ${dayLabel(e.end_date)}` : ""}
                        {e.courts ? ` · blocks ${e.courts}` : ""}
                      </p>
                    </div>
                    {e.over ? <Badge>Finished</Badge> : <Badge tone="green">Upcoming</Badge>}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={(100 * e.registered) / e.capacity} tone={e.registered >= e.capacity ? "red" : "primary"} />
                    <span className="shrink-0 text-xs font-semibold text-on-surface-variant">{e.registered} / {e.capacity}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Upcoming court blocks" icon="event_busy">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant text-left text-xs uppercase tracking-wide text-outline">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Court</th>
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Why</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((b, i) => (
                  <tr key={i} className="border-b border-outline-variant/50 last:border-0">
                    <td className="py-2">{dayLabel(b.block_date)}</td>
                    <td className="py-2">{b.court}</td>
                    <td className="py-2">{hourLabel(b.start_time)} – {hourLabel(b.end_time)}</td>
                    <td className="py-2">
                      <Badge tone={b.maintenance ? "amber" : "green"}>{b.why}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
