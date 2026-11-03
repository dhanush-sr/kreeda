import { embed } from "./embed.js";
import { upsert } from "./qdrant.js";

export async function indexGamePost(p) {
  const vector = await embed(`${p.sport}. ${p.post_text}. Preferred time: ${p.preferred_time ?? "any"}`);
  await upsert("game_posts", p.post_id, vector, { member_id: p.member_id, sport: p.sport, is_open: p.is_open });
}

export async function indexComplaint(c) {
  const vector = await embed(`${c.target}. ${c.complaint_text}`);
  await upsert("complaints", c.complaint_id, vector, { status: c.status, court_id: c.court_id, equipment_id: c.equipment_id });
}

export async function indexEvent(e) {
  const vector = await embed(`${e.name}. ${e.sport}. ${e.description ?? ""}`);
  await upsert("events", e.event_id, vector, { sport: e.sport, end_date: e.end_date });
}
