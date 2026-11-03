import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { one } from "./db.js";

const COOKIE = "kreeda_session";

function sign(data) {
  return crypto.createHmac("sha256", process.env.SESSION_SECRET).update(data).digest("base64url");
}

export async function startSession(userId) {
  const data = `${userId}.${Date.now()}`;
  const store = await cookies();
  store.set(COOKIE, `${data}.${sign(data)}`, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
}

export async function endSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function currentUser() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const cut = raw.lastIndexOf(".");
  const data = raw.slice(0, cut);
  const given = Buffer.from(raw.slice(cut + 1));
  const expected = Buffer.from(sign(data));
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  const [userId, issuedAt] = data.split(".").map(Number);
  if (Date.now() - issuedAt > 12 * 60 * 60 * 1000) return null;
  return one(
    `SELECT u.user_id, u.username, u.role, u.member_id, u.staff_id,
            COALESCE(m.full_name, s.full_name) AS name, m.reg_no, m.department, s.designation
     FROM app_user u
     LEFT JOIN member m ON m.member_id = u.member_id
     LEFT JOIN staff s ON s.staff_id = u.staff_id
     WHERE u.user_id = $1`,
    [userId]
  );
}

export function homeFor(role) {
  if (role === "MEMBER") return "/book";
  if (role === "STAFF") return "/staff";
  return "/admin";
}

export async function requireRole(...roles) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}
