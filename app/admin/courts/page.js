import { query } from "@/lib/db";
import { updateCourt, generateSlots } from "@/app/actions/admin";
import ActionForm from "@/components/ActionForm";
import { Badge, Card, Icon, PageHeader, buttonClass, ghostButtonClass, inputClass } from "@/components/ui";

export default async function AdminCourts() {
  const courts = await query(
    `SELECT c.*,
            (SELECT count(*) FROM slot s WHERE s.court_id = c.court_id AND s.slot_date >= CURRENT_DATE AND s.status = 'OPEN') AS open_slots,
            (SELECT max(slot_date)::text FROM slot s WHERE s.court_id = c.court_id) AS last_day
     FROM court c ORDER BY c.court_id`
  );
  const t = (v) => v.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader title="Courts & Booking Rules" subtitle="Rules are stored in the database and checked by the book_slot() procedure, so no screen or API call can get around them.">
        <ActionForm action={generateSlots} compact className="text-right">
          <button className={buttonClass}>
            <Icon name="calendar_add_on" /> Generate slots for next 7 days
          </button>
        </ActionForm>
      </PageHeader>

      <div className="grid grid-cols-2 gap-6">
        {courts.map((c) => (
          <Card
            key={c.court_id}
            title={c.name}
            icon={c.sport === "Basketball" ? "sports_basketball" : c.sport === "Tennis" ? "sports_baseball" : "sports_tennis"}
            action={c.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Closed</Badge>}
          >
            <p className="-mt-2 mb-4 text-xs text-outline">
              {c.sport} · {c.location} · {c.open_slots} open slots ahead · slots generated until {c.last_day}
            </p>
            <ActionForm action={updateCourt} hidden={{ court_id: c.court_id }} compact className="grid grid-cols-4 gap-3">
              {[
                ["open_time", "Opens", t(c.open_time)],
                ["close_time", "Closes", t(c.close_time)],
                ["peak_start", "Peak from", t(c.peak_start)],
                ["peak_end", "Peak until", t(c.peak_end)],
              ].map(([name, label, value]) => (
                <label key={name} className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-on-surface-variant">{label}</span>
                  <input name={name} type="time" step="3600" defaultValue={value} className={inputClass} />
                </label>
              ))}
              <label className="col-span-2 flex flex-col gap-1">
                <span className="text-xs font-semibold text-on-surface-variant">Max bookings per member per day</span>
                <input name="max_daily_bookings" type="number" min="1" defaultValue={c.max_daily_bookings} className={inputClass} />
              </label>
              <label className="col-span-2 flex flex-col gap-1">
                <span className="text-xs font-semibold text-on-surface-variant">Max peak bookings per week</span>
                <input name="max_peak_per_week" type="number" min="1" defaultValue={c.max_peak_per_week} className={inputClass} />
              </label>
              <label className="col-span-2 flex items-center gap-2 text-sm">
                <input name="is_active" type="checkbox" defaultChecked={c.is_active} className="accent-[#005532]" /> Open for booking
              </label>
              <div className="col-span-2 text-right">
                <button className={ghostButtonClass}>
                  <Icon name="save" className="text-[16px]" /> Save
                </button>
              </div>
            </ActionForm>
          </Card>
        ))}
      </div>
    </div>
  );
}
