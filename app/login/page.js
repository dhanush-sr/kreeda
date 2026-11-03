import { redirect } from "next/navigation";
import { one } from "@/lib/db";
import { currentUser, homeFor } from "@/lib/session";
import { login } from "@/app/actions/auth";
import ActionForm from "@/components/ActionForm";
import { Icon, inputClass, buttonClass } from "@/components/ui";

export default async function LoginPage() {
  const user = await currentUser();
  if (user) redirect(homeFor(user.role));
  const stats = await one(`
    SELECT (SELECT count(*) FROM court WHERE is_active) AS courts,
           (SELECT count(*) FROM slot WHERE slot_date = CURRENT_DATE) AS slots_today,
           (SELECT count(*) FROM booking WHERE status <> 'CANCELLED') AS bookings`);

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-on-primary lg:flex">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.18) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.18) 2px, transparent 2px)",
            backgroundSize: "120px 80px",
          }}
        />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-container blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Icon name="sports_tennis" />
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight">KREEDA</p>
            <p className="text-xs text-primary-fixed">PES University Sports Complex</p>
          </div>
        </div>
        <div className="relative max-w-lg">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold">
            <Icon name="verified" className="text-[16px]" /> Department of Physical Education
          </span>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
            Book PES courts fairly.
            <br />
            No more counter fights.
          </h1>
          <p className="mt-5 text-lg text-primary-fixed">
            Live availability, automatic waiting lists, and a database that decides who gets the court, even when two people click at once.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              ["stadium", `${stats.courts} courts`, "Badminton, tennis, basketball"],
              ["schedule", `${stats.slots_today} slots`, "open today"],
              ["verified_user", "0 double", "bookings, ever"],
            ].map(([icon, big, small]) => (
              <div key={big} className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <Icon name={icon} className="text-primary-fixed" />
                <p className="mt-2 text-xl font-bold">{big}</p>
                <p className="text-xs text-primary-fixed">{small}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-primary-fixed">PES University, Ring Road Campus · Bengaluru</p>
      </section>

      <section className="flex items-center justify-center bg-surface p-8">
        <div className="w-full max-w-md rounded-3xl border border-outline-variant/70 bg-surface-container-lowest p-10 shadow-sm">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-container text-primary">
            <Icon name="sports_score" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Welcome to KREEDA</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Sign in to book courts, find a game, or run the counter desk.</p>
          <ActionForm action={login} className="mt-8 flex flex-col gap-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">Registration number or staff code</span>
              <input name="username" className={inputClass} placeholder="PES1UG24AM083" autoComplete="username" required />
              <span className="text-xs text-outline">Members use their SRN. Staff and admin use their staff code.</span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">Password</span>
              <input name="password" type="password" className={inputClass} placeholder="••••••••" autoComplete="current-password" required />
            </label>
            <button className={`${buttonClass} mt-2 py-3`}>
              Sign in <Icon name="arrow_forward" />
            </button>
          </ActionForm>
          <div className="mt-8 rounded-xl border border-outline-variant/60 bg-surface-container-low p-4 text-xs text-on-surface-variant">
            <p className="mb-1 font-semibold text-on-surface">Demo logins (password: kreeda123)</p>
            <p>Member: PES1UG24AM083 · Staff: STF101 · Admin: ADM001</p>
          </div>
        </div>
      </section>
    </main>
  );
}
