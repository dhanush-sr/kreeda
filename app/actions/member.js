"use server";

import { revalidatePath } from "next/cache";
import { query, one, dbError } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { embed } from "@/lib/embed";
import { search, setPayload } from "@/lib/qdrant";
import { indexGamePost, indexComplaint } from "@/lib/vectors";

const me = () => requireRole("MEMBER");

function refresh(...paths) {
  for (const p of paths) revalidatePath(p);
}

export async function bookSlot(prev, form) {
  const user = await me();
  const slot = Number(form.get("slot_id"));
  try {
    await query("SELECT book_slot($1, $2)", [user.member_id, slot]);
    refresh("/book", "/activity");
    return { ok: true, message: "Booked! The slot is yours." };
  } catch (e) {
    if (e.code !== "23505") return { ok: false, message: dbError(e) };
    try {
      const { pos } = await one("SELECT join_waitlist($1, $2) AS pos", [user.member_id, slot]);
      refresh("/book", "/activity");
      return { ok: false, message: `Someone booked this slot a moment ago. You have been added to the waiting list at position ${pos}.` };
    } catch (e2) {
      return { ok: false, message: dbError(e2) };
    }
  }
}

export async function joinWaitlist(prev, form) {
  const user = await me();
  try {
    const { pos } = await one("SELECT join_waitlist($1, $2) AS pos", [user.member_id, Number(form.get("slot_id"))]);
    refresh("/book", "/activity");
    return { ok: true, message: `You are #${pos} on the waiting list. If it frees up, it becomes yours automatically.` };
  } catch (e) {
    return { ok: false, message: dbError(e) };
  }
}

export async function leaveWaitlist(prev, form) {
  const user = await me();
  await query("UPDATE waiting_list SET status = 'LEFT' WHERE wait_id = $1 AND member_id = $2 AND status = 'WAITING'", [
    Number(form.get("wait_id")),
    user.member_id,
  ]);
  refresh("/book", "/activity");
  return { ok: true, message: "Left the waiting list." };
}

export async function cancelBooking(prev, form) {
  const user = await me();
  try {
    await query("SELECT cancel_booking($1, $2)", [Number(form.get("booking_id")), user.member_id]);
    refresh("/book", "/activity");
    return { ok: true, message: "Booking cancelled." };
  } catch (e) {
    return { ok: false, message: dbError(e) };
  }
}

export async function registerEvent(prev, form) {
  const user = await me();
  try {
    await query(
      `INSERT INTO event_registration (event_id, member_id) VALUES ($1, $2)
       ON CONFLICT (event_id, member_id) DO UPDATE SET status = 'REGISTERED', registered_on = LOCALTIMESTAMP`,
      [Number(form.get("event_id")), user.member_id]
    );
    refresh("/events", "/activity");
    return { ok: true, message: "You're registered!" };
  } catch (e) {
    return { ok: false, message: dbError(e) };
  }
}

export async function unregisterEvent(prev, form) {
  const user = await me();
  await query("UPDATE event_registration SET status = 'CANCELLED' WHERE event_id = $1 AND member_id = $2", [
    Number(form.get("event_id")),
    user.member_id,
  ]);
  refresh("/events", "/activity");
  return { ok: true, message: "Registration withdrawn." };
}

export async function postGame(prev, form) {
  const user = await me();
  try {
    const post = await one(
      `INSERT INTO game_post (member_id, sport, post_text, preferred_time) VALUES ($1, $2, $3, NULLIF($4, ''))
       RETURNING post_id, member_id, sport, post_text, preferred_time, is_open`,
      [user.member_id, form.get("sport"), String(form.get("post_text") ?? "").trim(), String(form.get("preferred_time") ?? "").trim()]
    );
    await indexGamePost(post).catch(() => {});
    refresh("/games");
    return { ok: true, message: "Posted. Your matches are below." };
  } catch (e) {
    return { ok: false, message: e.code === "23514" ? "Describe the game in at least 10 characters." : dbError(e) };
  }
}

export async function closeGame(prev, form) {
  const user = await me();
  const id = Number(form.get("post_id"));
  await query("UPDATE game_post SET is_open = FALSE WHERE post_id = $1 AND member_id = $2", [id, user.member_id]);
  await setPayload("game_posts", id, { is_open: false }).catch(() => {});
  refresh("/games");
  return { ok: true, message: "Post closed." };
}

export async function similarComplaints(text, target) {
  await me();
  if (String(text).trim().length < 12) return [];
  const [kind, id] = String(target).split(":");
  const targetName = (
    await one(kind === "court" ? "SELECT name FROM court WHERE court_id = $1" : "SELECT name FROM equipment WHERE equipment_id = $1", [Number(id)])
  )?.name;
  const hits = await search("complaints", await embed(`${targetName ?? ""}. ${text}`), {
    mustNot: [{ key: "status", match: { value: "RESOLVED" } }],
    limit: 3,
    threshold: 0.6,
  }).catch(() => []);
  if (!hits.length) return [];
  const rows = await query("SELECT complaint_id, complaint_text, target, reports, status FROM v_open_complaints WHERE complaint_id = ANY($1)", [
    hits.map((h) => h.id),
  ]);
  return hits
    .map((h) => ({ ...rows.find((r) => r.complaint_id === h.id), score: Math.round(h.score * 100) }))
    .filter((r) => r.complaint_id);
}

export async function raiseComplaint(prev, form) {
  const user = await me();
  const [kind, id] = String(form.get("target") ?? "").split(":");
  const text = String(form.get("complaint_text") ?? "").trim();
  const duplicateOf = Number(form.get("duplicate_of")) || null;
  try {
    const c = await one(
      `INSERT INTO complaint (member_id, court_id, equipment_id, complaint_text, duplicate_of)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING complaint_id, complaint_text, status, court_id, equipment_id`,
      [user.member_id, kind === "court" ? Number(id) : null, kind === "equipment" ? Number(id) : null, text, duplicateOf]
    );
    if (!duplicateOf) {
      const target = await one("SELECT COALESCE(ct.name, e.name) AS name FROM complaint c LEFT JOIN court ct USING (court_id) LEFT JOIN equipment e USING (equipment_id) WHERE c.complaint_id = $1", [c.complaint_id]);
      await indexComplaint({ ...c, target: target.name }).catch(() => {});
    }
    refresh("/complaints");
    return {
      ok: true,
      message: duplicateOf ? "Added your report to the existing complaint. More reports means it gets fixed sooner." : "Complaint raised. Staff will look into it.",
    };
  } catch (e) {
    return { ok: false, message: e.code === "23514" ? "Pick a court or item and describe the problem (at least 10 characters)." : dbError(e) };
  }
}
