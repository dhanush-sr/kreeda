import Link from "next/link";
import { query, one } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { bookSlot, joinWaitlist, cancelBooking } from "@/app/actions/member";
import ActionForm from "@/components/ActionForm";
import { Badge, Card, Icon, PageHeader, Progress, buttonClass, dangerButtonClass } from "@/components/ui";
import { dayLabel, dayParts, hourLabel, timeRange } from "@/lib/format";

const SPORTS = [
  ["All", "apps"],
  ["Badminton", "sports_tennis"],
  ["Tennis", "sports_baseball"],
  ["Basketball", "sports_basketball"],
];

export default async function BookPage({ searchParams }) {
  const user = await requireRole("MEMBER");
  const sp = await searchParams;
  const days = await query("SELECT d::date::text AS day FROM generate_series(CURRENT_DATE, CURRENT_DATE + 6, INTERVAL '1 day') d");
  const today = days[0].day;
  const day = days.some((d) => d.day === sp.date) ? sp.date : today;
  const sport = SPORTS.some(([s]) => s === sp.sport) ? sp.sport : "All";

  const slots = await query(
    `SELECT v.*, (v.slot_date + v.start_time) <= LOCALTIMESTAMP AS past
     FROM v_slot_board v
     WHERE v.slot_date = $1 AND ($2 = 'All' OR v.sport = $2)
     ORDER BY v.court_id, v.start_time`,
    [day, sport]
  );
  const myWaits = await query("SELECT slot_id, position FROM waiting_list WHERE member_id = $1 AND status = 'WAITING'", [user.member_id]);
  const dayLoad = await query(
    `SELECT slot_date::text AS day, round(100.0 * count(*) FILTER (WHERE status <> 'OPEN') / count(*)) AS full_pct
     FROM slot WHERE slot_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 6 GROUP BY slot_date`
  );
  const stats = await one("SELECT * FROM v_member_stats WHERE member_id = $1", [user.member_id]);
  const upcoming = await query(
    `SELECT b.booking_id, c.name, s.slot_date, s.start_time, s.end_time
     FROM booking b JOIN slot s USING (slot_id) JOIN court c ON c.court_id = s.court_id
     WHERE b.member_id = $1 AND b.status = 'CONFIRMED'
     ORDER BY s.slot_date, s.start_time LIMIT 3`,
    [user.member_id]
  );

  const courts = [];
  for (const s of slots) {
    let row = courts.find((c) => c.court_id === s.court_id);
    if (!row) courts.push((row = { court_id: s.court_id, name: s.court_name, sport: s.sport, location: s.location, slots: [] }));
    row.slots.push(s);
  }
  const upcomingSlots = slots.filter((s) => !s.past);
  const hours = [...new Set((upcomingSlots.length ? upcomingSlots : slots).map((s) => s.start_time))].sort();
  const selected = slots.find((s) => s.slot_id === Number(sp.slot));
  const { peak_limit: peakLimit } = await one("SELECT min(max_peak_per_week) AS peak_limit FROM court WHERE is_active");
  const link = (extra) => {
    const q = new URLSearchParams({ date: day, sport, ...extra });
    return `/book?${q}`;
  };

  function cell(s) {
    const mine = s.booked_by === user.member_id;
    const waiting = myWaits.find((w) => w.slot_id === s.slot_id);
    const isSel = selected?.slot_id === s.slot_id;
    let cls = "border border-primary/70 bg-white text-primary hover:bg-secondary-container";
    let label = "Open";
    if (s.status === "BLOCKED") {
      cls = "stripes text-amber-900 border border-amber-300";
      label = "Event";
    } else if (mine) {
      cls = "bg-primary text-on-primary border border-primary";
      label = "Yours";
    } else if (waiting) {
      cls = "bg-amber-100 text-amber-800 border border-amber-300";
      label = `#${waiting.position}`;
    } else if (s.status === "BOOKED") {
      cls = "bg-slate-100 text-slate-500 border border-slate-200 hover:border-slate-400";
      label = s.waiting > 0 ? `+${s.waiting} wait` : "Booked";
    }
    if (s.past) {
      cls = "bg-slate-50 text-slate-300 border border-slate-100";
      label = mine ? "Played" : "—";
    }
    const pill = (
      <span
        title={s.block_reason ?? undefined}
        className={`flex h-10 w-full items-center justify-center rounded-lg text-[11px] font-semibold transition ${cls} ${isSel ? "ring-2 ring-offset-2 ring-primary" : ""} ${s.peak && !s.past ? "shadow-sm" : ""}`}
      >
        {label}
      </span>
    );
    if (s.past || s.status === "BLOCKED") return pill;
    return (
      <Link href={link({ slot: s.slot_id })} scroll={false}>
        {pill}
      </Link>
    );
  }

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-6">
        <PageHeader title="Book a Court" subtitle="Indoor Stadium & Outdoor Blocks · open 6 AM to 9 PM · peak hours are 5–9 PM (tennis 4–7 PM)">
          <Badge tone="green">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Live availability
          </Badge>
        </PageHeader>

        <div className="grid grid-cols-7 gap-3">
          {days.map(({ day: d }) => {
            const p = dayParts(d);
            const load = dayLoad.find((x) => x.day === d)?.full_pct ?? 0;
            const active = d === day;
            return (
              <Link
                key={d}
                href={`/book?${new URLSearchParams({ date: d, sport })}`}
                className={`relative flex flex-col items-center rounded-xl border p-3 shadow-sm transition ${
                  active ? "border-primary bg-primary text-on-primary" : "border-outline-variant bg-white hover:border-primary"
                }`}
              >
                {d === today && (
                  <span className="absolute -top-2.5 rounded-full bg-tertiary-fixed px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-tertiary-fixed">Today</span>
                )}
                <span className={`text-[11px] font-bold uppercase ${active ? "text-primary-fixed" : "text-outline"}`}>{p.weekday}</span>
                <span className="text-xl font-bold">{p.day}</span>
                <span className={`text-[11px] ${active ? "text-primary-fixed" : "text-outline"}`}>{p.month}</span>
                <span className={`mt-2 h-1.5 w-1.5 rounded-full ${load > 60 ? "bg-error" : load > 35 ? "bg-amber-500" : "bg-emerald-500"}`} title={`${load}% taken`} />
              </Link>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-outline-variant/60 py-3">
          <div className="flex flex-wrap gap-2">
            {SPORTS.map(([s, icon]) => (
              <Link
                key={s}
                href={`/book?${new URLSearchParams({ date: day, sport: s })}`}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  s === sport ? "bg-on-secondary-fixed-variant text-on-primary shadow-sm" : "border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                <Icon name={icon} className="text-[16px]" />
                {s === "All" ? "All sports" : s}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-on-surface-variant">
            <span className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded border border-primary bg-white" /> Open</span>
            <span className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded bg-slate-200" /> Booked</span>
            <span className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded bg-primary" /> Yours</span>
            <span className="flex items-center gap-1.5"><span className="stripes h-3.5 w-3.5 rounded" /> Event</span>
            <span className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded bg-amber-200" /> You're waiting</span>
          </div>
        </div>

        <Card title={`Schedule — ${dayLabel(day)}`} icon="view_timeline" action={<span className="text-xs text-outline">Click an open slot to book, or a booked one to join its waiting list</span>}>
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full border-separate border-spacing-1.5">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-48 bg-white pb-2 text-left text-xs font-semibold text-outline">Court</th>
                  {hours.map((h) => (
                    <th key={h} className="min-w-16 pb-2 text-center text-[11px] font-semibold text-outline">{hourLabel(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courts.map((c) => (
                  <tr key={c.court_id}>
                    <td className="sticky left-0 z-10 bg-white pr-3">
                      <p className="text-sm font-semibold text-on-surface">{c.name}</p>
                      <p className="text-xs text-outline">{c.location}</p>
                    </td>
                    {hours.map((h) => {
                      const s = c.slots.find((x) => x.start_time === h);
                      return <td key={h}>{s ? cell(s) : <span className="block h-10 rounded-lg bg-slate-50" />}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <aside className="w-80 shrink-0 space-y-6">
        <Card title="Your booking" action={selected?.peak ? <Badge tone="green">● Peak hour</Badge> : null}>
          {selected ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-outline-variant/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{selected.court_name}</p>
                  <Badge tone="green">{selected.sport}</Badge>
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-on-surface"><Icon name="schedule" className="text-[18px] text-outline" /> {dayLabel(selected.slot_date)}, {timeRange(selected.start_time, selected.end_time)}</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-outline"><Icon name="location_on" className="text-[16px]" /> {selected.location}</p>
              </div>
              {selected.booked_by === user.member_id ? (
                <p className="rounded-xl bg-secondary-container/50 p-3 text-sm font-medium text-on-secondary-fixed-variant">This slot is yours. Cancel it from Upcoming if you can't make it.</p>
              ) : selected.status === "OPEN" ? (
                <ActionForm action={bookSlot} hidden={{ slot_id: selected.slot_id }}>
                  <button className={`${buttonClass} w-full py-3`}>Confirm booking <Icon name="arrow_forward" /></button>
                </ActionForm>
              ) : (
                <ActionForm action={joinWaitlist} hidden={{ slot_id: selected.slot_id }}>
                  <p className="mb-3 text-sm text-on-surface-variant">
                    Already booked{selected.waiting ? ` · ${selected.waiting} waiting` : ""}. Join the waiting list and it becomes yours automatically if they cancel.
                  </p>
                  <button className={`${buttonClass} w-full bg-amber-600 py-3 hover:bg-amber-700`}>Join waiting list <Icon name="hourglass_top" /></button>
                </ActionForm>
              )}
            </div>
          ) : (
            <p className="text-sm text-outline">Pick a slot from the schedule.</p>
          )}
          <div className="mt-5 rounded-xl border border-outline-variant/70 p-4">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-on-surface"><Icon name="shield" className="text-[16px] text-primary" /> Fair-use limit</span>
              <span className="text-primary">{stats.peak_this_week} of {peakLimit} used</span>
            </div>
            <Progress value={(stats.peak_this_week / peakLimit) * 100} tone={stats.peak_this_week >= peakLimit ? "red" : "primary"} />
            <p className="mt-2 text-xs text-outline">Peak bookings this week. Max 2 bookings per sport per day.</p>
          </div>
        </Card>

        <Card title="Upcoming" action={<Badge>{upcoming.length} active</Badge>}>
          <div className="space-y-3">
            {upcoming.length === 0 && <p className="text-sm text-outline">No upcoming bookings.</p>}
            {upcoming.map((b) => (
              <div key={b.booking_id} className="rounded-xl border border-outline-variant/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{b.name}</p>
                    <p className="text-xs text-on-surface-variant">{dayLabel(b.slot_date)}, {timeRange(b.start_time, b.end_time)}</p>
                  </div>
                  <ActionForm action={cancelBooking} hidden={{ booking_id: b.booking_id }} compact>
                    <button className={dangerButtonClass}>Cancel</button>
                  </ActionForm>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}
