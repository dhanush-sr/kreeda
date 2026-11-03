import { query } from "@/lib/db";
import { checkIn, markNoShow, runNoShows } from "@/app/actions/staff";
import ActionForm from "@/components/ActionForm";
import { Badge, Card, Empty, Icon, PageHeader, Stat, ghostButtonClass, inputClass } from "@/components/ui";
import { dayLabel, hourLabel, stamp, timeRange } from "@/lib/format";

export default async function CounterDesk({ searchParams }) {
  const q = String((await searchParams).q ?? "").trim();
  const rows = await query(
    `SELECT v.*, (v.slot_date + v.start_time) <= LOCALTIMESTAMP AS started,
            (v.slot_date + v.start_time) - INTERVAL '15 minutes' <= LOCALTIMESTAMP AS can_mark
     FROM v_todays_schedule v
     WHERE $1 = '' OR v.reg_no ILIKE '%' || $1 || '%' OR v.full_name ILIKE '%' || $1 || '%'
     ORDER BY v.start_time, v.court_name`,
    [q]
  );
  const total = rows.length;
  const checked = rows.filter((r) => r.status === "COMPLETED").length;
  const missed = rows.filter((r) => r.status === "NO_SHOW").length;
  const late = rows.filter((r) => r.status === "CONFIRMED" && r.started).length;
  const today = rows[0]?.slot_date;

  return (
    <div className="space-y-6">
      <PageHeader title="Counter Desk — Today" subtitle={today ? `${dayLabel(today)} · mark who turned up so no-shows are tracked` : "Mark who turned up so no-shows are tracked"}>
        <ActionForm action={runNoShows} compact className="text-right">
          <button className={ghostButtonClass}>
            <Icon name="person_off" className="text-[16px]" /> Mark missed bookings as no-show
          </button>
        </ActionForm>
      </PageHeader>

      <div className="grid grid-cols-4 gap-4">
        <Stat label="Bookings today" value={total} icon="event" />
        <Stat label="Checked in" value={checked} sub={total ? `${Math.round((100 * checked) / total)}% of today` : ""} icon="how_to_reg" tone="blue" />
        <Stat label="No-shows" value={missed} icon="person_off" tone="red" />
        <Stat label="Started, not checked in" value={late} sub="Check them in or mark no-show" icon="schedule" tone="amber" />
      </div>

      <Card
        title="Today's bookings"
        icon="list"
        action={
          <form className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline" />
            <input name="q" defaultValue={q} placeholder="Search SRN or name" className={`${inputClass} w-64 pl-9`} />
          </form>
        }
      >
        {rows.length === 0 ? (
          <Empty>No bookings{q ? " match that search" : " today"}.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-left text-xs uppercase tracking-wide text-outline">
                <th className="pb-2">Time</th>
                <th className="pb-2">Court</th>
                <th className="pb-2">Member</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.booking_id} className={`border-b border-outline-variant/50 last:border-0 ${r.status === "CONFIRMED" && r.started ? "bg-amber-50" : ""}`}>
                  <td className="py-3 font-semibold">{timeRange(r.start_time, r.end_time)}</td>
                  <td className="py-3">
                    {r.court_name}
                    <span className="block text-xs text-outline">{r.sport}</span>
                  </td>
                  <td className="py-3">
                    {r.full_name}
                    <span className="block text-xs text-outline">{r.reg_no}</span>
                  </td>
                  <td className="py-3">
                    {r.status === "COMPLETED" && <Badge tone="green">Checked in {r.check_in ? hourLabel(r.check_in.slice(11, 16)) : ""}</Badge>}
                    {r.status === "NO_SHOW" && <Badge tone="red">No-show</Badge>}
                    {r.status === "CONFIRMED" && (r.started ? <Badge tone="amber">Not here yet</Badge> : <Badge tone="blue">Upcoming</Badge>)}
                  </td>
                  <td className="py-3">
                    {r.status === "CONFIRMED" && r.can_mark ? (
                      <div className="flex justify-end gap-2">
                        <ActionForm action={checkIn} hidden={{ booking_id: r.booking_id }} compact>
                          <button className={`${ghostButtonClass} border-primary text-primary`}>
                            <Icon name="check" className="text-[16px]" /> Check in
                          </button>
                        </ActionForm>
                        <ActionForm action={markNoShow} hidden={{ booking_id: r.booking_id }} compact>
                          <button className={ghostButtonClass}>No-show</button>
                        </ActionForm>
                      </div>
                    ) : (
                      <p className="text-right text-xs text-outline">{r.status === "CONFIRMED" ? `Opens ${hourLabel(r.start_time)}` : ""}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
