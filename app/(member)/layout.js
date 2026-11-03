import { requireRole } from "@/lib/session";
import { one } from "@/lib/db";
import Sidebar from "@/components/Sidebar";

export default async function MemberLayout({ children }) {
  const user = await requireRole("MEMBER");
  const counts = await one(
    `SELECT (SELECT count(*) FROM game_post WHERE is_open AND member_id <> $1) AS games,
            (SELECT count(*) FROM booking b JOIN slot s USING (slot_id) WHERE b.member_id = $1 AND b.status = 'CONFIRMED') AS upcoming`,
    [user.member_id]
  );
  const items = [
    { href: "/book", label: "Book a Court", icon: "sports_tennis" },
    { href: "/activity", label: "My Activity", icon: "history", badge: counts.upcoming || null },
    { href: "/games", label: "Find a Game", icon: "groups", badge: counts.games ? `${counts.games} open` : null },
    { href: "/events", label: "Events", icon: "emoji_events" },
    { href: "/complaints", label: "Complaints", icon: "report_problem" },
  ];
  return (
    <div className="min-h-screen bg-court">
      <Sidebar items={items} user={user} />
      <main className="ml-72 min-h-screen px-8 py-8">{children}</main>
    </div>
  );
}
