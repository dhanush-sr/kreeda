import { query, close } from "../lib/db.js";
import { resetCollections } from "../lib/qdrant.js";
import { indexGamePost, indexComplaint, indexEvent } from "../lib/vectors.js";

await resetCollections();

const posts = await query("SELECT post_id, member_id, sport, post_text, preferred_time, is_open FROM game_post");
for (const p of posts) await indexGamePost(p);
console.log(`game_posts: ${posts.length}`);

const complaints = await query(
  `SELECT c.complaint_id, c.complaint_text, c.status, c.court_id, c.equipment_id, COALESCE(ct.name, e.name) AS target
   FROM complaint c
   LEFT JOIN court ct ON ct.court_id = c.court_id
   LEFT JOIN equipment e ON e.equipment_id = c.equipment_id
   WHERE c.duplicate_of IS NULL`
);
for (const c of complaints) await indexComplaint(c);
console.log(`complaints: ${complaints.length}`);

const events = await query("SELECT event_id, name, sport, description, end_date FROM event");
for (const e of events) await indexEvent(e);
console.log(`events: ${events.length}`);

await close();
