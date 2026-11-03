const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parts(day) {
  const [y, m, d] = day.slice(0, 10).split("-").map(Number);
  return { date: new Date(Date.UTC(y, m - 1, d)), m, d };
}

export function hourLabel(time) {
  const h = Number(time.slice(0, 2));
  const min = time.slice(3, 5);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return min === "00" ? `${h12} ${suffix}` : `${h12}:${min} ${suffix}`;
}

export function timeRange(start, end) {
  return `${hourLabel(start)} – ${hourLabel(end)}`;
}

export function dayLabel(day) {
  const { date, m, d } = parts(day);
  return `${DAYS[date.getUTCDay()]} ${d} ${MONTHS[m - 1]}`;
}

export function dayParts(day) {
  const { date, m, d } = parts(day);
  return { weekday: DAYS[date.getUTCDay()], day: d, month: MONTHS[m - 1] };
}

export function stamp(ts) {
  if (!ts) return "";
  return `${dayLabel(ts)}, ${hourLabel(ts.slice(11, 16))}`;
}

export function initials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function rupees(n) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}
