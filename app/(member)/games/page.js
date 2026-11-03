import Link from "next/link";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { embed } from "@/lib/embed";
import { search, match } from "@/lib/qdrant";
import { postGame, closeGame } from "@/app/actions/member";
import ActionForm from "@/components/ActionForm";
import { Badge, Card, Empty, Field, Icon, PageHeader, buttonClass, ghostButtonClass, inputClass } from "@/components/ui";
import { initials, stamp } from "@/lib/format";

const POST_SQL = `SELECT p.post_id, p.sport, p.post_text, p.preferred_time, p.posted_at, p.is_open, m.full_name, m.department
                  FROM game_post p JOIN member m USING (member_id)`;

function PostCard({ p, score }) {
  return (
    <div className="rounded-2xl border border-outline-variant/70 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-sm font-bold text-primary">{initials(p.full_name)}</div>
          <div>
            <p className="text-sm font-semibold">{p.full_name}</p>
            <p className="text-xs text-outline">{p.department} · {stamp(p.posted_at)}</p>
          </div>
        </div>
        {score != null && <Badge tone={score >= 60 ? "dark" : "green"}>{score}% match</Badge>}
      </div>
      <p className="mt-3 text-sm italic text-on-surface">“{p.post_text}”</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone="green">{p.sport}</Badge>
        {p.preferred_time && <Badge><Icon name="schedule" className="text-[14px]" /> {p.preferred_time}</Badge>}
        <Link href={`/book?sport=${p.sport}`} className={`${ghostButtonClass} ml-auto`}>
          <Icon name="sports_tennis" className="text-[16px]" /> Book a court together
        </Link>
      </div>
    </div>
  );
}

export default async function GamesPage() {
  const user = await requireRole("MEMBER");
  const mine = await query(`${POST_SQL} WHERE p.member_id = $1 ORDER BY p.is_open DESC, p.posted_at DESC`, [user.member_id]);
  const latest = mine.find((p) => p.is_open);

  let matches = [];
  if (latest) {
    const hits = await search("game_posts", await embed(`${latest.sport}. ${latest.post_text}. Preferred time: ${latest.preferred_time ?? "any"}`), {
      must: [match("is_open", true), match("sport", latest.sport)],
      mustNot: [match("member_id", user.member_id)],
      limit: 6,
    }).catch(() => []);
    const rows = hits.length ? await query(`${POST_SQL} WHERE p.post_id = ANY($1)`, [hits.map((h) => h.id)]) : [];
    matches = hits.map((h) => ({ p: rows.find((r) => r.post_id === h.id), score: Math.round(h.score * 100) })).filter((m) => m.p);
  }
  const recent = await query(`${POST_SQL} WHERE p.is_open AND p.member_id <> $1 ORDER BY p.posted_at DESC LIMIT 6`, [user.member_id]);

  return (
    <div className="space-y-6">
      <PageHeader title="Find a Game" subtitle="Say what kind of game you want in your own words. We match you with people who want the same thing, even if they worded it differently." />

      <Card title="What are you looking for?" icon="edit_note">
        <ActionForm action={postGame} className="grid grid-cols-6 gap-4">
          <div className="col-span-1">
            <Field label="Sport">
              <select name="sport" className={inputClass} defaultValue="Badminton">
                <option>Badminton</option>
                <option>Tennis</option>
                <option>Basketball</option>
              </select>
            </Field>
          </div>
          <div className="col-span-3">
            <Field label="Describe the game">
              <input name="post_text" className={inputClass} placeholder="e.g. casual doubles in the evening, beginner friendly" required minLength={10} />
            </Field>
          </div>
          <div className="col-span-1">
            <Field label="Preferred time">
              <input name="preferred_time" className={inputClass} placeholder="After 6 PM" />
            </Field>
          </div>
          <div className="col-span-1 flex items-end">
            <button className={`${buttonClass} w-full`}>
              <Icon name="send" /> Post
            </button>
          </div>
        </ActionForm>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{latest ? "Matches for you" : "Open games"}</h3>
            <span className="flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-fixed-variant">
              <Icon name="auto_awesome" className="text-[16px]" /> Matched by meaning, not keywords
            </span>
          </div>
          {latest && (
            <p className="text-sm text-on-surface-variant">
              Based on your post: <span className="italic">“{latest.post_text}”</span>
            </p>
          )}
          {latest && matches.length === 0 && <Empty>No open {latest.sport} posts yet. Check back soon.</Empty>}
          {(latest ? matches : recent.map((p) => ({ p }))).map(({ p, score }) => (
            <PostCard key={p.post_id} p={p} score={score} />
          ))}
        </div>

        <Card title="Your posts" icon="person">
          {mine.length === 0 ? (
            <Empty>You haven't posted yet.</Empty>
          ) : (
            <div className="space-y-3">
              {mine.map((p) => (
                <div key={p.post_id} className="rounded-xl border border-outline-variant/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={p.is_open ? "green" : "grey"}>{p.is_open ? "Open" : "Closed"}</Badge>
                    <span className="text-xs text-outline">{p.sport}</span>
                  </div>
                  <p className="mt-2 text-sm">{p.post_text}</p>
                  {p.is_open && (
                    <ActionForm action={closeGame} hidden={{ post_id: p.post_id }} compact className="mt-2">
                      <button className={ghostButtonClass}>Close post</button>
                    </ActionForm>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
