export const staffNav = [
  { href: "/staff", label: "Counter Desk", icon: "desk", exact: true },
  { href: "/staff/items", label: "Keys & Equipment", icon: "key" },
  { href: "/staff/complaints", label: "Complaints Queue", icon: "build" },
];

export const adminNav = [
  { href: "/admin", label: "Reports", icon: "monitoring", exact: true },
  { href: "/admin/events", label: "Events & Court Blocks", icon: "event_busy" },
  { href: "/admin/courts", label: "Courts & Booking Rules", icon: "tune" },
];

export function navFor(role) {
  return role === "ADMIN" ? [...adminNav, ...staffNav] : staffNav;
}
