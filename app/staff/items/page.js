import { query } from "@/lib/db";
import { issueKey, returnKey, issueEquipment, returnEquipment } from "@/app/actions/staff";
import ActionForm from "@/components/ActionForm";
import { Badge, Card, Empty, Field, Icon, PageHeader, Progress, buttonClass, ghostButtonClass, inputClass } from "@/components/ui";
import { stamp } from "@/lib/format";

export default async function ItemsPage() {
  const [freeKeys, keysOut, stock, gearOut] = await Promise.all([
    query("SELECT key_id, key_code, key_section FROM locker_key WHERE status = 'AVAILABLE' ORDER BY key_code"),
    query(
      `SELECT i.key_issue_id, k.key_code, k.key_section, m.full_name, m.reg_no, i.in_time
       FROM key_issue i JOIN locker_key k USING (key_id) JOIN member m USING (member_id)
       WHERE i.out_time IS NULL ORDER BY i.in_time`
    ),
    query("SELECT equipment_id, name, category, total_qty, available_qty FROM equipment ORDER BY equipment_id"),
    query(
      `SELECT i.eq_issue_id, e.name, i.qty_issued, m.full_name, m.reg_no, i.issue_time, i.due_time, i.due_time < LOCALTIMESTAMP AS overdue
       FROM equipment_issue i JOIN equipment e USING (equipment_id) JOIN member m USING (member_id)
       WHERE i.return_time IS NULL ORDER BY i.due_time`
    ),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Keys & Equipment" subtitle="Every key and item is tied to a member and the staff who issued it. Stock updates itself and late returns are fined automatically (₹10 per hour per item)." />

      <div className="grid grid-cols-6 gap-3">
        {stock.map((s) => (
          <div key={s.equipment_id} className="rounded-2xl border border-outline-variant/70 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-outline">{s.category}</p>
            <p className="truncate text-sm font-semibold">{s.name}</p>
            <p className="mt-2 text-2xl font-extrabold text-primary">
              {s.available_qty}
              <span className="text-sm font-medium text-outline"> / {s.total_qty}</span>
            </p>
            <Progress value={(100 * s.available_qty) / s.total_qty} tone={s.available_qty / s.total_qty < 0.3 ? "red" : "primary"} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Issue locker key" icon="key">
          <ActionForm action={issueKey} className="grid grid-cols-3 items-end gap-3">
            <Field label="Member SRN">
              <input name="srn" className={inputClass} placeholder="PES1UG24..." required />
            </Field>
            <Field label="Key">
              <select name="key_id" className={inputClass} required>
                {freeKeys.map((k) => (
                  <option key={k.key_id} value={k.key_id}>{k.key_code} · {k.key_section.replace(" Locker Room", "")}</option>
                ))}
              </select>
            </Field>
            <button className={buttonClass}>Issue key</button>
          </ActionForm>
          <h4 className="mb-2 mt-6 text-sm font-semibold text-on-surface-variant">Keys out right now ({keysOut.length})</h4>
          {keysOut.length === 0 ? (
            <Empty>All keys are at the counter.</Empty>
          ) : (
            <div className="space-y-2">
              {keysOut.map((k) => (
                <div key={k.key_issue_id} className="flex items-center justify-between rounded-xl border border-outline-variant/70 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-12 items-center justify-center rounded-lg bg-secondary-container text-sm font-bold text-primary">{k.key_code}</span>
                    <div>
                      <p className="text-sm font-semibold">{k.full_name}</p>
                      <p className="text-xs text-outline">{k.reg_no} · since {stamp(k.in_time)}</p>
                    </div>
                  </div>
                  <ActionForm action={returnKey} hidden={{ key_issue_id: k.key_issue_id }} compact>
                    <button className={ghostButtonClass}>Return</button>
                  </ActionForm>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Issue equipment" icon="sports_tennis">
          <ActionForm action={issueEquipment} className="grid grid-cols-4 items-end gap-3">
            <Field label="Member SRN">
              <input name="srn" className={inputClass} placeholder="PES1UG24..." required />
            </Field>
            <Field label="Item">
              <select name="equipment_id" className={inputClass}>
                {stock.map((s) => (
                  <option key={s.equipment_id} value={s.equipment_id} disabled={s.available_qty === 0}>
                    {s.name} ({s.available_qty})
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Qty">
                <input name="qty" type="number" min="1" defaultValue="1" className={inputClass} />
              </Field>
              <Field label="Hours">
                <input name="hours" type="number" min="1" max="8" defaultValue="2" className={inputClass} />
              </Field>
            </div>
            <button className={buttonClass}>Issue</button>
          </ActionForm>
          <h4 className="mb-2 mt-6 text-sm font-semibold text-on-surface-variant">Items out right now ({gearOut.length})</h4>
          {gearOut.length === 0 ? (
            <Empty>Nothing is out.</Empty>
          ) : (
            <div className="space-y-2">
              {gearOut.map((g) => (
                <div key={g.eq_issue_id} className={`flex items-center justify-between rounded-xl border p-3 ${g.overdue ? "border-red-200 bg-error-container/20" : "border-outline-variant/70"}`}>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      {g.qty_issued} × {g.name} {g.overdue && <Badge tone="red"><Icon name="alarm" className="text-[14px]" /> Overdue</Badge>}
                    </p>
                    <p className="text-xs text-outline">{g.full_name} · {g.reg_no} · due {stamp(g.due_time)}</p>
                  </div>
                  <ActionForm action={returnEquipment} hidden={{ eq_issue_id: g.eq_issue_id }} compact className="text-right">
                    <button className={ghostButtonClass}>Return</button>
                  </ActionForm>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
