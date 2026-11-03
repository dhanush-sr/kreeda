"use server";

import { redirect } from "next/navigation";
import { one, query } from "@/lib/db";
import { startSession, endSession, homeFor } from "@/lib/session";

export async function login(prev, form) {
  const username = String(form.get("username") ?? "").trim().toUpperCase();
  const password = String(form.get("password") ?? "");
  if (!username || !password) return { ok: false, message: "Enter your registration number (or staff code) and password." };
  const user = await one(
    "SELECT user_id, role FROM app_user WHERE upper(username) = $1 AND password_hash = crypt($2, password_hash)",
    [username, password]
  );
  if (!user) return { ok: false, message: "Invalid credentials. Check your SRN or staff code and password." };
  await query("UPDATE app_user SET last_login = LOCALTIMESTAMP WHERE user_id = $1", [user.user_id]);
  await startSession(user.user_id);
  redirect(homeFor(user.role));
}

export async function logout() {
  await endSession();
  redirect("/login");
}
