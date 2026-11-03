"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { Icon } from "./ui";

export default function Sidebar({ items, user, roleLabel }) {
  const path = usePathname();
  const initials = user.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col justify-between border-r border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm">
            <Icon name="sports_tennis" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-primary">KREEDA</h1>
              {roleLabel && <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[11px] font-bold text-on-secondary-fixed-variant">{roleLabel}</span>}
            </div>
            <p className="text-xs text-outline">PES University Sports Complex</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1.5">
          {items.map((item) => {
            const active = item.exact ? path === item.href : path === item.href || path.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "flex items-center justify-between rounded-lg border-l-4 border-primary bg-secondary-container px-4 py-3 font-semibold text-on-secondary-fixed-variant shadow-sm"
                    : "flex items-center justify-between rounded-lg px-4 py-3 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
                }
              >
                <span className="flex items-center gap-3 text-sm font-semibold">
                  <Icon name={item.icon} filled={active} />
                  {item.label}
                </span>
                {item.badge ? <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[11px] font-bold text-on-secondary-fixed">{item.badge}</span> : null}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-col gap-3 border-t border-outline-variant pt-4">
        <div className="flex items-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-low p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-on-primary">{initials}</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-on-surface">{user.name}</p>
            <p className="truncate text-xs text-outline">{user.reg_no ? `${user.reg_no} · ${user.department}` : user.designation}</p>
          </div>
        </div>
        <form action={logout}>
          <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error-container/40">
            <Icon name="logout" />
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
