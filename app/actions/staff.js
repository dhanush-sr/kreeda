"use server";

import { revalidatePath } from "next/cache";
import { query, one, dbError } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { setPayload } from "@/lib/qdrant";
import { rupees } from "@/lib/format";

const staff = () => requireRole("STAFF", "ADMIN");

async function memberBySrn(srn) {
  return one("SELECT member_id, full_name FROM member WHERE upper(reg_no) = upper($1) AND is_active", [String(srn).trim()]);
}

export async function checkIn(prev, form) {
  const user = await staff();
  try {
    await query("INSERT INTO attendance (booking_id, marked_by, check_in) VALUES ($1, $2, LOCALTIMESTAMP)", [Number(form.get("booking_id")), user.staff_id]);
    revalidatePath("/staff");
    return { ok: true, message: "Checked in" };
  } catch (e) {
    return { ok: false, message: dbError(e) };
  }
}

export async function markNoShow(prev, form) {
  const user = await staff();
  try {
    await query("INSERT INTO attendance (booking_id, marked_by, is_no_show) VALUES ($1, $2, TRUE)", [Number(form.get("booking_id")), user.staff_id]);
    revalidatePath("/staff");
    return { ok: true, message: "Marked no-show" };
  } catch (e) {
    return { ok: false, message: dbError(e) };
  }
}

export async function runNoShows() {
  await staff();
  const { n } = await one("SELECT mark_no_shows() AS n");
  revalidatePath("/staff");
  return { ok: true, message: n ? `${n} missed booking${n > 1 ? "s" : ""} marked as no-show.` : "No missed bookings right now." };
}

export async function issueKey(prev, form) {
  const user = await staff();
  const m = await memberBySrn(form.get("srn"));
  if (!m) return { ok: false, message: "No active member with that SRN." };
  try {
    await query("INSERT INTO key_issue (key_id, member_id, issued_by) VALUES ($1, $2, $3)", [Number(form.get("key_id")), m.member_id, user.staff_id]);
    revalidatePath("/staff/items");
    return { ok: true, message: `Key issued to ${m.full_name}.` };
  } catch (e) {
    return { ok: false, message: e.code === "23505" ? `${m.full_name} already holds a key.` : dbError(e) };
  }
}

export async function returnKey(prev, form) {
  await staff();
  await query("UPDATE key_issue SET out_time = LOCALTIMESTAMP WHERE key_issue_id = $1 AND out_time IS NULL", [Number(form.get("key_issue_id"))]);
  revalidatePath("/staff/items");
  return { ok: true, message: "Key returned" };
}

export async function issueEquipment(prev, form) {
  const user = await staff();
  const m = await memberBySrn(form.get("srn"));
  if (!m) return { ok: false, message: "No active member with that SRN." };
  try {
    await query(
      `INSERT INTO equipment_issue (equipment_id, member_id, issued_by, qty_issued, due_time)
       VALUES ($1, $2, $3, $4, LOCALTIMESTAMP + make_interval(hours => $5))`,
      [Number(form.get("equipment_id")), m.member_id, user.staff_id, Number(form.get("qty")), Number(form.get("hours"))]
    );
    revalidatePath("/staff/items");
    return { ok: true, message: `Issued to ${m.full_name}.` };
  } catch (e) {
    return { ok: false, message: dbError(e) };
  }
}

export async function returnEquipment(prev, form) {
  await staff();
  const row = await one("UPDATE equipment_issue SET return_time = LOCALTIMESTAMP WHERE eq_issue_id = $1 AND return_time IS NULL RETURNING fine_amount", [
    Number(form.get("eq_issue_id")),
  ]);
  revalidatePath("/staff/items");
  if (!row) return { ok: false, message: "Already returned" };
  return { ok: true, message: row.fine_amount > 0 ? `Returned late · fine ${rupees(row.fine_amount)}` : "Returned on time" };
}

export async function setComplaintStatus(prev, form) {
  await staff();
  const id = Number(form.get("complaint_id"));
  const status = String(form.get("status"));
  try {
    await query("UPDATE complaint SET status = $2 WHERE complaint_id = $1 OR duplicate_of = $1", [id, status]);
    await setPayload("complaints", id, { status }).catch(() => {});
    revalidatePath("/staff/complaints");
    return { ok: true, message: status === "RESOLVED" ? "Resolved" : "Marked in progress" };
  } catch (e) {
    return { ok: false, message: dbError(e) };
  }
}
