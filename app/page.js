import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/session";

export default async function Home() {
  const user = await currentUser();
  redirect(user ? homeFor(user.role) : "/login");
}
