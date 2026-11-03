import { query } from "@/lib/db";
import { setComplaintStatus } from "@/app/actions/staff";
import ActionForm from "@/components/ActionForm";
import { Badge, Card, Empty, Icon, PageHeader, ghostButtonClass } from "@/components/ui";
import { stamp } from "@/lib/format";

export default async function ComplaintsQueue() {
  const [open, dups, resolved] = await Promise.all([
    query("SELECT * FROM v_open_complaints ORDER BY reports DESC, reported_on"),
    query(
      `SELECT c.duplicate_of, c.complaint_text, c.reported_on, m.full_name
       FROM complaint c JOIN member m USING (member_id) WHERE c.duplicate_of IS NOT NULL ORDER BY c.reported_on`
    ),
    query(
      `SELECT c.complaint_text, COALESCE(ct.name, e.name) AS target, c.reported_on
       FROM complaint c LEFT JOIN court ct USING (court_id) LEFT JOIN equipment e USING (equipment_id)
       WHERE c.status = 'RESOLVED' AND c.duplicate_of IS NULL ORDER BY c.reported_on DESC LIMIT 5`
    ),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complaints Queue"
        subtitle="Similar complaints are grouped by meaning, so one torn net reported five different ways shows up once, with five reports."
      />
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {open.length === 0 && <Empty>No open complaints.</Empty>}
          {open.map((c) => {
            const group = dups.filter((d) => d.duplicate_of === c.complaint_id);
            return (
              <div key={c.complaint_id} className="rounded-2xl border border-outline-variant/70 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge tone="green">{c.target}</Badge>
                      <Badge tone={c.status === "OPEN" ? "red" : "amber"}>{c.status === "OPEN" ? "Open" : "In progress"}</Badge>
                      <Badge tone={c.reports > 2 ? "red" : "grey"}>
                        <Icon name="group" className="text-[14px]" /> {c.reports} report{c.reports > 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <p className="font-medium">{c.complaint_text}</p>
                    <p className="mt-1 text-xs text-outline">First reported by {c.reported_by} · {stamp(c.reported_on)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {c.status === "OPEN" && (
                      <ActionForm action={setComplaintStatus} hidden={{ complaint_id: c.complaint_id, status: "IN_PROGRESS" }} compact>
                        <button className={ghostButtonClass}>Start work</button>
                      </ActionForm>
                    )}
                    <ActionForm action={setComplaintStatus} hidden={{ complaint_id: c.complaint_id, status: "RESOLVED" }} compact>
                      <button className={`${ghostButtonClass} border-primary text-primary`}>
                        <Icon name="check" className="text-[16px]" /> Resolve
                      </button>
                    </ActionForm>
                  </div>
                </div>
                {group.length > 0 && (
                  <div className="mt-4 space-y-1.5 border-t border-outline-variant/50 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-outline">Also reported as</p>
                    {group.map((d, i) => (
                      <p key={i} className="text-sm text-on-surface-variant">
                        “{d.complaint_text}” <span className="text-xs text-outline">· {d.full_name}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Card title="Recently resolved" icon="task_alt">
          <ul className="space-y-3">
            {resolved.map((r, i) => (
              <li key={i} className="rounded-xl border border-outline-variant/70 p-3">
                <p className="text-xs font-semibold text-primary">{r.target}</p>
                <p className="text-sm">{r.complaint_text}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
