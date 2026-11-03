import { query } from "@/lib/db";
import { requireRole } from "@/lib/session";
import ComplaintForm from "@/components/ComplaintForm";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { stamp } from "@/lib/format";

const STATUS = { OPEN: ["red", "Open"], IN_PROGRESS: ["amber", "In progress"], RESOLVED: ["green", "Resolved"] };

export default async function ComplaintsPage() {
  const user = await requireRole("MEMBER");
  const [courts, equipment, mine, top] = await Promise.all([
    query("SELECT court_id, name FROM court ORDER BY court_id"),
    query("SELECT equipment_id, name FROM equipment ORDER BY equipment_id"),
    query(
      `SELECT c.complaint_id, c.complaint_text, c.status, c.reported_on, c.duplicate_of IS NOT NULL AS added,
              COALESCE(ct.name, e.name) AS target
       FROM complaint c LEFT JOIN court ct USING (court_id) LEFT JOIN equipment e USING (equipment_id)
       WHERE c.member_id = $1 ORDER BY c.reported_on DESC`,
      [user.member_id]
    ),
    query("SELECT complaint_text, target, reports, status FROM v_open_complaints ORDER BY reports DESC, reported_on DESC LIMIT 4"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Complaints" subtitle="Report damaged nets, lights or equipment. Repeat reports are grouped, so staff can see what's hurting the most people." />
      <div className="grid grid-cols-5 gap-6">
        <Card title="Raise a complaint" icon="report" className="col-span-2">
          <ComplaintForm courts={courts} equipment={equipment} />
        </Card>
        <div className="col-span-3 space-y-6">
          <Card title="Your complaints" icon="list_alt">
            {mine.length === 0 ? (
              <Empty>You haven't raised any complaints.</Empty>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant text-left text-xs uppercase tracking-wide text-outline">
                    <th className="pb-2">Issue</th>
                    <th className="pb-2">About</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Reported</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.map((c) => (
                    <tr key={c.complaint_id} className="border-b border-outline-variant/50 align-top last:border-0">
                      <td className="py-3 pr-3">
                        {c.complaint_text}
                        {c.added && <span className="mt-1 block text-xs text-outline">Added to an existing report</span>}
                      </td>
                      <td className="py-3 pr-3 text-on-surface-variant">{c.target}</td>
                      <td className="py-3 pr-3">
                        <Badge tone={STATUS[c.status][0]}>{STATUS[c.status][1]}</Badge>
                      </td>
                      <td className="py-3 text-xs text-outline">{stamp(c.reported_on)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
          <Card title="Most reported right now" icon="trending_up">
            <div className="grid grid-cols-2 gap-3">
              {top.map((t, i) => (
                <div key={i} className="rounded-xl border border-outline-variant/70 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-on-surface-variant">{t.target}</span>
                    <Badge tone={t.reports > 2 ? "red" : "amber"}>{t.reports} reports</Badge>
                  </div>
                  <p className="text-sm">{t.complaint_text}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
