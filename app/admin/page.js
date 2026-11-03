import { query, one } from "@/lib/db";
import { Bars, Donut, Trend } from "@/components/Charts";
import { Badge, Card, Icon, PageHeader, Progress, Stat } from "@/components/ui";
import { dayLabel, rupees } from "@/lib/format";

function View({ name }) {
  return <code className="rounded bg-surface-container-low px-2 py-0.5 text-[11px] text-outline">{name}</code>;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function ReportsPage() {
  const [kpi, dept, util, peak, noShows, play, hotspots, fill, gear, daily, split] = await Promise.all([
    one("SELECT * FROM r_kpis"),
    query("SELECT * FROM r_dept_avg_bookings"),
    query("SELECT * FROM r_court_utilisation"),
    query("SELECT * FROM r_peak_hours"),
    query("SELECT * FROM r_repeat_no_shows LIMIT 8"),
    query("SELECT * FROM r_play_time"),
    query("SELECT * FROM r_complaint_hotspots"),
    query("SELECT * FROM r_event_fill"),
    query("SELECT * FROM r_equipment_usage"),
    query("SELECT day::text, played, no_shows, cancelled FROM r_daily_bookings"),
    query(
      `SELECT CASE b.status WHEN 'COMPLETED' THEN 'Completed' WHEN 'CONFIRMED' THEN 'Upcoming' WHEN 'NO_SHOW' THEN 'No-show' ELSE 'Cancelled' END AS name,
              count(*) AS value
       FROM booking b JOIN slot s USING (slot_id) WHERE s.slot_date >= CURRENT_DATE - 28
       GROUP BY 1 ORDER BY 2 DESC`
    ),
  ]);
  const maxPeak = Math.max(...peak.map((p) => p.bookings), 1);
  const hours = [...new Set(peak.map((p) => p.hour))].sort((a, b) => a - b);
  const busiest = peak.reduce((a, b) => (b.bookings > a.bookings ? b : a), peak[0]);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Facility Analytics" subtitle="Every chart below is a SQL view in PostgreSQL (see db/reports.sql), refreshed live on each visit.">
        <Badge tone="green">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Live data · last 4 weeks
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-4 gap-4">
        <Stat label="Bookings this week" value={kpi.bookings_this_week} sub={`${kpi.active_members} active members`} icon="event_available" />
        <Stat label="Court utilisation" value={`${kpi.utilisation_pct}%`} sub="Booked share of all slots, last 28 days" icon="donut_large" tone="blue" />
        <Stat label="No-show rate" value={`${kpi.no_show_pct}%`} sub={`${kpi.people_waiting} people on waiting lists`} icon="person_off" tone="amber" />
        <Stat label="Open complaints" value={kpi.open_complaints} sub="Grouped by meaning" icon="build" tone="red" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card title="Bookings per day" icon="show_chart" action={<View name="r_daily_bookings" />} className="col-span-2">
          <Trend data={daily} />
        </Card>
        <Card title="Booking outcomes" icon="pie_chart" action={<span className="text-xs text-outline">28 days</span>}>
          <Donut data={split} />
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Average bookings per member, by department" icon="bar_chart" action={<View name="r_dept_avg_bookings" />}>
          <Bars data={dept} x="department" y="avg_bookings_per_member" />
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-left text-xs uppercase tracking-wide text-outline">
                <th className="pb-2">Department</th>
                <th className="pb-2 text-right">Members</th>
                <th className="pb-2 text-right">Bookings</th>
                <th className="pb-2 text-right">Average</th>
              </tr>
            </thead>
            <tbody>
              {dept.map((d) => (
                <tr key={d.department} className="border-b border-outline-variant/50 last:border-0">
                  <td className="py-2 font-semibold">{d.department}</td>
                  <td className="py-2 text-right">{d.members}</td>
                  <td className="py-2 text-right">{d.bookings}</td>
                  <td className="py-2 text-right font-bold text-primary">{d.avg_bookings_per_member}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Court utilisation" icon="stadium" action={<View name="r_court_utilisation" />}>
          <div className="space-y-5">
            {util.map((u, i) => (
              <div key={u.name}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-semibold">{u.name} <span className="font-normal text-outline">· {u.sport}</span></span>
                  <span className="font-bold text-primary">{u.utilisation_pct}%</span>
                </div>
                <Progress value={u.utilisation_pct} tone={i === util.length - 1 ? "amber" : "primary"} />
                <p className="mt-1 text-xs text-outline">{u.used_slots} of {u.total_slots} slots used</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card
          title="Peak hours"
          icon="local_fire_department"
          action={<View name="r_peak_hours" />}
          className="col-span-2"
        >
          <p className="mb-4 text-sm text-on-surface-variant">
            Busiest: <b>{busiest.weekday} {busiest.hour > 12 ? busiest.hour - 12 : busiest.hour} {busiest.hour >= 12 ? "PM" : "AM"}</b> with {busiest.bookings} bookings over 4 weeks.
          </p>
          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-1">
              <thead>
                <tr>
                  <th />
                  {hours.map((h) => (
                    <th key={h} className="w-10 text-center text-[10px] font-semibold text-outline">{h > 12 ? h - 12 : h}{h >= 12 ? "p" : "a"}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((d, i) => (
                  <tr key={d}>
                    <td className="pr-2 text-xs font-semibold text-outline">{d}</td>
                    {hours.map((h) => {
                      const v = peak.find((p) => p.dow === i + 1 && p.hour === h)?.bookings ?? 0;
                      return (
                        <td key={h} title={`${d} ${h}:00 · ${v} bookings`}>
                          <div className="h-8 w-10 rounded-md" style={{ background: `rgba(0, 85, 50, ${0.06 + 0.94 * (v / maxPeak)})` }} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Average play time" icon="timer" action={<View name="r_play_time" />}>
          <Bars data={play} x="sport" y="avg_minutes" unit=" min" height={220} />
          <p className="mt-2 text-center text-xs text-outline">Minutes between check-in and check-out</p>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card title="Repeat no-shows" icon="person_off" action={<View name="r_repeat_no_shows" />}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-left text-xs uppercase tracking-wide text-outline">
                <th className="pb-2">Member</th>
                <th className="pb-2 text-right">No-shows</th>
                <th className="pb-2 text-right">Rate</th>
              </tr>
            </thead>
            <tbody>
              {noShows.map((n) => (
                <tr key={n.reg_no} className="border-b border-outline-variant/50 last:border-0">
                  <td className="py-2">
                    <p className="font-semibold">{n.full_name}</p>
                    <p className="text-xs text-outline">{n.reg_no}</p>
                  </td>
                  <td className="py-2 text-right font-bold">{n.no_shows}</td>
                  <td className="py-2 text-right">
                    <Badge tone={n.no_show_pct >= 30 ? "red" : "amber"}>{n.no_show_pct}%</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Event fill rate" icon="emoji_events" action={<View name="r_event_fill" />}>
          <div className="space-y-5">
            {fill.map((e) => (
              <div key={e.name}>
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="font-semibold">{e.name}</span>
                  <span className="shrink-0 font-bold text-primary">{e.fill_pct}%</span>
                </div>
                <Progress value={e.fill_pct} tone={e.fill_pct >= 100 ? "red" : "primary"} />
                <p className="mt-1 text-xs text-outline">{e.registered} / {e.capacity} · {dayLabel(e.start_date)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Courts with most complaints" icon="report" action={<View name="r_complaint_hotspots" />}>
          <p className="mb-4 text-xs text-outline">Courts with more complaints than the average court (HAVING with a subquery).</p>
          <div className="space-y-3">
            {hotspots.map((h) => (
              <div key={h.name} className="flex items-center justify-between rounded-xl border border-outline-variant/70 p-3">
                <div className="flex items-center gap-3">
                  <Icon name="warning" className="text-error" />
                  <span className="font-semibold">{h.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold">{h.complaints}</p>
                  <p className="text-xs text-outline">{h.still_open} still open</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Equipment issued, overdue and fines" icon="inventory_2" action={<View name="r_equipment_usage" />}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant text-left text-xs uppercase tracking-wide text-outline">
              <th className="pb-2">Item</th>
              <th className="pb-2">In stock</th>
              <th className="pb-2 text-right">Times issued</th>
              <th className="pb-2 text-right">Units</th>
              <th className="pb-2 text-right">Overdue now</th>
              <th className="pb-2 text-right">Fines collected</th>
            </tr>
          </thead>
          <tbody>
            {gear.map((g) => (
              <tr key={g.name} className="border-b border-outline-variant/50 last:border-0">
                <td className="py-2.5">
                  <p className="font-semibold">{g.name}</p>
                  <p className="text-xs text-outline">{g.category}</p>
                </td>
                <td className="w-48 py-2.5">
                  <div className="flex items-center gap-2">
                    <Progress value={(100 * g.available_qty) / g.total_qty} />
                    <span className="text-xs text-outline">{g.available_qty}/{g.total_qty}</span>
                  </div>
                </td>
                <td className="py-2.5 text-right">{g.times_issued}</td>
                <td className="py-2.5 text-right">{g.units_issued}</td>
                <td className="py-2.5 text-right">{g.overdue_now > 0 ? <Badge tone="red">{g.overdue_now}</Badge> : "0"}</td>
                <td className="py-2.5 text-right font-semibold">{rupees(g.fines_collected)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
