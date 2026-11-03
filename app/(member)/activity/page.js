import { query, one } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { cancelBooking, leaveWaitlist } from "@/app/actions/member";
import ActionForm from "@/components/ActionForm";
import { WeekBars } from "@/components/Charts";
import { Badge, Card, Empty, Icon, PageHeader, Stat, dangerButtonClass, ghostButtonClass } from "@/components/ui";
import { dayLabel, rupees, stamp, timeRange } from "@/lib/format";

const STATUS = {
  CONFIRMED: ["blue", "Upcoming"],
  COMPLETED: ["green", "Played"],
  NO_SHOW: ["amber", "No-show"],
  CANCELLED: ["red", "Cancelled"],
};

export default async function ActivityPage() {
  const user = await requireRole("MEMBER");
  const id = user.member_id;
  const [stats, weeks, upcoming, notices, waits, events, gear, key, history] = await Promise.all([
    one("SELECT * FROM v_member_stats WHERE member_id = $1", [id]),
    query(
      `SELECT to_char(w, 'DD Mon') AS label,
              count(b.booking_id) FILTER (WHERE b.status IN ('COMPLETED', 'CONFIRMED')) AS played,
              count(b.booking_id) FILTER (WHERE b.status = 'NO_SHOW') AS no_shows
       FROM generate_series(date_trunc('week', CURRENT_DATE) - INTERVAL '5 weeks', date_trunc('week', CURRENT_DATE), INTERVAL '1 week') w
       LEFT JOIN slot s ON date_trunc('week', s.slot_date) = w
       LEFT JOIN booking b ON b.slot_id = s.slot_id AND b.member_id = $1
       GROUP BY w ORDER BY w`,
      [id]
    ),
    query(
      `SELECT b.booking_id, c.name, c.sport, s.slot_date, s.start_time, s.end_time, w.wait_id IS NOT NULL AS from_waitlist
       FROM booking b JOIN slot s USING (slot_id) JOIN court c ON c.court_id = s.court_id
       LEFT JOIN waiting_list w ON w.slot_id = b.slot_id AND w.member_id = b.member_id AND w.status = 'PROMOTED'
       WHERE b.member_id = $1 AND b.status = 'CONFIRMED' ORDER BY s.slot_date, s.start_time`,
      [id]
    ),
    query(
      `SELECT b.cancel_reason, b.cancelled_at, c.name, s.slot_date, s.start_time, s.end_time
       FROM booking b JOIN slot s USING (slot_id) JOIN court c ON c.court_id = s.court_id
       WHERE b.member_id = $1 AND b.cancel_reason LIKE 'Court blocked%' AND s.slot_date >= CURRENT_DATE - 7
       ORDER BY b.cancelled_at DESC`,
      [id]
    ),
    query(
      `SELECT w.wait_id, w.position, c.name, s.slot_date, s.start_time, s.end_time,
              (SELECT count(*) FROM waiting_list x WHERE x.slot_id = w.slot_id AND x.status = 'WAITING') AS total
       FROM waiting_list w JOIN slot s USING (slot_id) JOIN court c ON c.court_id = s.court_id
       WHERE w.member_id = $1 AND w.status = 'WAITING' ORDER BY s.slot_date, s.start_time`,
      [id]
    ),
    query(
      `SELECT e.name, e.sport, e.start_date, e.end_date FROM event_registration r JOIN event e USING (event_id)
       WHERE r.member_id = $1 AND r.status = 'REGISTERED' ORDER BY e.start_date DESC`,
      [id]
    ),
    query(
      `SELECT e.name, i.qty_issued, i.issue_time, i.due_time, i.due_time < LOCALTIMESTAMP AS overdue
       FROM equipment_issue i JOIN equipment e USING (equipment_id)
       WHERE i.member_id = $1 AND i.return_time IS NULL`,
      [id]
    ),
    one(
      `SELECT k.key_code, k.key_section, i.in_time FROM key_issue i JOIN locker_key k USING (key_id)
       WHERE i.member_id = $1 AND i.out_time IS NULL`,
      [id]
    ),
    query(
      `SELECT b.status, c.name, s.slot_date, s.start_time, s.end_time
       FROM booking b JOIN slot s USING (slot_id) JOIN court c ON c.court_id = s.court_id
       WHERE b.member_id = $1 AND (s.slot_date + s.start_time) < LOCALTIMESTAMP
       ORDER BY s.slot_date DESC, s.start_time DESC LIMIT 8`,
      [id]
    ),
  ]);
  const fines = await one("SELECT COALESCE(sum(fine_amount), 0) AS total FROM equipment_issue WHERE member_id = $1", [id]);

  return (
    <div className="space-y-6">
      <PageHeader title="My Activity" subtitle="Your bookings, waiting lists, events and anything you've borrowed from the counter." />

      <div className="grid grid-cols-4 gap-4">
        <Stat label="Bookings this week" value={stats.this_week} sub={`${stats.total_bookings} all time`} icon="event_available" />
        <Stat label="Peak bookings used" value={`${stats.peak_this_week} / 3`} sub="Resets every Monday" icon="local_fire_department" tone="amber" />
        <Stat label="Attendance rate" value={`${stats.attendance_rate ?? 100}%`} sub={`${stats.attended} sessions played`} icon="verified" tone="blue" />
        <Stat label="No-shows" value={stats.no_shows} sub="Booked but didn't turn up" icon="person_off" tone="red" />
      </div>

      {notices.length > 0 && (
        <div className="space-y-2">
          {notices.map((n, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <Icon name="campaign" className="text-amber-700" />
              <span>
                Your booking on <b>{n.name}</b>, {dayLabel(n.slot_date)} {timeRange(n.start_time, n.end_time)} was cancelled. {n.cancel_reason}.
              </span>
              <span className="ml-auto text-xs text-amber-700">{stamp(n.cancelled_at)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <Card title="Upcoming bookings" icon="calendar_month" className="col-span-2">
          {upcoming.length === 0 ? (
            <Empty>No upcoming bookings. Head to Book a Court to grab a slot.</Empty>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant text-left text-xs uppercase tracking-wide text-outline">
                  <th className="pb-2">Court</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Time</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {upcoming.map((b) => (
                  <tr key={b.booking_id} className="border-b border-outline-variant/50 last:border-0">
                    <td className="py-3">
                      <p className="font-semibold">{b.name}</p>
                      {b.from_waitlist && <Badge tone="green" className="mt-1">Got it from the waiting list</Badge>}
                    </td>
                    <td className="py-3">{dayLabel(b.slot_date)}</td>
                    <td className="py-3">{timeRange(b.start_time, b.end_time)}</td>
                    <td className="py-3 text-right">
                      <ActionForm action={cancelBooking} hidden={{ booking_id: b.booking_id }} compact>
                        <button className={dangerButtonClass}>Cancel</button>
                      </ActionForm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Last 6 weeks" icon="insights">
          <WeekBars data={weeks} />
          <p className="mt-2 text-xs text-outline">Green = played, amber = no-show</p>
        </Card>

        <Card title="Waiting lists" icon="hourglass_top">
          {waits.length === 0 ? (
            <Empty>You're not waiting for any slot.</Empty>
          ) : (
            <div className="space-y-3">
              {waits.map((w) => (
                <div key={w.wait_id} className="flex items-center justify-between gap-2 rounded-xl border border-outline-variant/70 p-3">
                  <div>
                    <p className="text-sm font-semibold">{w.name}</p>
                    <p className="text-xs text-on-surface-variant">{dayLabel(w.slot_date)}, {timeRange(w.start_time, w.end_time)}</p>
                    <Badge tone="amber" className="mt-1">#{w.position} of {w.total}</Badge>
                  </div>
                  <ActionForm action={leaveWaitlist} hidden={{ wait_id: w.wait_id }} compact>
                    <button className={ghostButtonClass}>Leave</button>
                  </ActionForm>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Event registrations" icon="emoji_events">
          {events.length === 0 ? (
            <Empty>Not registered for any events.</Empty>
          ) : (
            <ul className="space-y-3">
              {events.map((e) => (
                <li key={e.name} className="rounded-xl border border-outline-variant/70 p-3">
                  <p className="text-sm font-semibold">{e.name}</p>
                  <p className="text-xs text-on-surface-variant">{e.sport} · {dayLabel(e.start_date)}{e.end_date !== e.start_date ? ` – ${dayLabel(e.end_date)}` : ""}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Items with you" icon="backpack">
          {gear.length === 0 && !key ? (
            <Empty>Nothing borrowed right now.</Empty>
          ) : (
            <ul className="space-y-3">
              {key && (
                <li className="flex items-center gap-3 rounded-xl border border-outline-variant/70 p-3">
                  <Icon name="key" className="text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Locker key {key.key_code}</p>
                    <p className="text-xs text-on-surface-variant">{key.key_section} · since {stamp(key.in_time)}</p>
                  </div>
                </li>
              )}
              {gear.map((g, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl border border-outline-variant/70 p-3">
                  <Icon name="sports_tennis" className="text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{g.qty_issued} × {g.name}</p>
                    <p className="text-xs text-on-surface-variant">Due {stamp(g.due_time)}</p>
                  </div>
                  {g.overdue && <Badge tone="red">Overdue</Badge>}
                </li>
              ))}
            </ul>
          )}
          {fines.total > 0 && <p className="mt-3 text-xs text-outline">Late fines so far: {rupees(fines.total)}</p>}
        </Card>

        <Card title="Recent sessions" icon="history" className="col-span-3">
          <div className="grid grid-cols-4 gap-3">
            {history.map((h, i) => (
              <div key={i} className="rounded-xl border border-outline-variant/70 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{h.name}</p>
                  <Badge tone={STATUS[h.status][0]}>{STATUS[h.status][1]}</Badge>
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">{dayLabel(h.slot_date)}, {timeRange(h.start_time, h.end_time)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
