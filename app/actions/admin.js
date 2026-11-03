"use server";

import { revalidatePath } from "next/cache";
import { query, one, transaction, dbError } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { indexEvent } from "@/lib/vectors";

const admin = () => requireRole("ADMIN");

export async function createEvent(prev, form) {
  const user = await admin();
  const courts = form.getAll("courts").map(Number);
  const f = (k) => String(form.get(k) ?? "").trim();
  try {
    const { event, cancelled } = await transaction(async (db) => {
      const { rows } = await db.query(
        `INSERT INTO event (created_by, name, sport, start_date, end_date, capacity, description)
         VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, ''))
         RETURNING event_id, name, sport, description, end_date`,
        [user.staff_id, f("name"), f("sport"), f("start_date"), f("end_date"), Number(f("capacity")), f("description")]
      );
      const event = rows[0];
      if (courts.length) {
        await db.query(
          `INSERT INTO court_block (event_id, court_id, block_date, start_time, end_time, reason)
           SELECT $1::int, c, d::date, $4::time, $5::time, 'Event'
           FROM unnest($2::int[]) c
           CROSS JOIN generate_series($3::date, (SELECT end_date FROM event WHERE event_id = $1), INTERVAL '1 day') d`,
          [event.event_id, courts, f("start_date"), f("block_start"), f("block_end")]
        );
      }
      const { rows: c } = await db.query("SELECT count(*) AS n FROM booking WHERE cancelled_at = LOCALTIMESTAMP AND cancel_reason LIKE 'Court blocked%'");
      return { event, cancelled: c[0].n };
    });
    await indexEvent(event).catch(() => {});
    revalidatePath("/admin/events");
    revalidatePath("/events");
    return {
      ok: true,
      message: `"${event.name}" created${courts.length ? ` and ${courts.length} court${courts.length > 1 ? "s" : ""} blocked` : ""}. ${
        cancelled ? `${cancelled} clashing booking${cancelled > 1 ? "s were" : " was"} cancelled and the members notified.` : "No bookings clashed."
      }`,
    };
  } catch (e) {
    return { ok: false, message: e.code === "23505" ? "An event with that name already exists." : dbError(e) };
  }
}

export async function addBlock(prev, form) {
  await admin();
  try {
    const n = await transaction(async (db) => {
      await db.query("INSERT INTO court_block (court_id, block_date, start_time, end_time, reason) VALUES ($1, $2, $3, $4, $5)", [
        Number(form.get("court_id")),
        form.get("block_date"),
        form.get("start_time"),
        form.get("end_time"),
        String(form.get("reason") ?? "").trim() || "Maintenance",
      ]);
      const { rows } = await db.query("SELECT count(*) AS n FROM booking WHERE cancelled_at = LOCALTIMESTAMP AND cancel_reason LIKE 'Court blocked%'");
      return rows[0].n;
    });
    revalidatePath("/admin/events");
    return { ok: true, message: `Court blocked. ${n} booking${n === 1 ? "" : "s"} cancelled.` };
  } catch (e) {
    return { ok: false, message: dbError(e) };
  }
}

export async function updateCourt(prev, form) {
  await admin();
  const g = (k) => form.get(k);
  try {
    await query(
      `UPDATE court SET open_time = $2, close_time = $3, peak_start = $4, peak_end = $5,
              max_daily_bookings = $6, max_peak_per_week = $7, is_active = $8
       WHERE court_id = $1`,
      [Number(g("court_id")), g("open_time"), g("close_time"), g("peak_start"), g("peak_end"), Number(g("max_daily_bookings")), Number(g("max_peak_per_week")), g("is_active") === "on"]
    );
    revalidatePath("/admin/courts");
    return { ok: true, message: "Saved" };
  } catch (e) {
    return { ok: false, message: e.code === "23514" ? "Check the times: closing must be after opening, peak end after peak start." : dbError(e) };
  }
}

export async function generateSlots() {
  await admin();
  const { n } = await one("SELECT generate_slots(CURRENT_DATE, CURRENT_DATE + 7) AS n");
  revalidatePath("/admin/courts");
  revalidatePath("/book");
  return { ok: true, message: n ? `${n} new slots created for the next 7 days.` : "Slots for the next 7 days already exist." };
}
