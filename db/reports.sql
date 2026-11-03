CREATE OR REPLACE VIEW r_dept_avg_bookings AS
SELECT m.department, COUNT(DISTINCT m.member_id) AS members, COUNT(b.booking_id) AS bookings,
       ROUND(COUNT(b.booking_id)::numeric / COUNT(DISTINCT m.member_id), 2) AS avg_bookings_per_member
FROM member m
LEFT JOIN booking b ON b.member_id = m.member_id AND b.status <> 'CANCELLED'
GROUP BY m.department
ORDER BY avg_bookings_per_member DESC;

SELECT * FROM r_dept_avg_bookings;

CREATE OR REPLACE VIEW r_court_utilisation AS
SELECT c.name, c.sport, COUNT(s.slot_id) AS total_slots, COUNT(b.booking_id) AS used_slots,
       ROUND(100.0 * COUNT(b.booking_id) / NULLIF(COUNT(s.slot_id), 0), 1) AS utilisation_pct
FROM court c
JOIN slot s ON s.court_id = c.court_id AND s.status <> 'BLOCKED' AND s.slot_date BETWEEN CURRENT_DATE - 28 AND CURRENT_DATE - 1
LEFT JOIN booking b ON b.slot_id = s.slot_id AND b.status IN ('COMPLETED', 'NO_SHOW')
GROUP BY c.court_id, c.name, c.sport
ORDER BY utilisation_pct DESC;

SELECT * FROM r_court_utilisation;

CREATE OR REPLACE VIEW r_peak_hours AS
SELECT EXTRACT(ISODOW FROM s.slot_date)::int AS dow, TO_CHAR(s.slot_date, 'Dy') AS weekday,
       EXTRACT(HOUR FROM s.start_time)::int AS hour, COUNT(*) AS bookings
FROM booking b
JOIN slot s ON s.slot_id = b.slot_id
WHERE b.status <> 'CANCELLED' AND s.slot_date BETWEEN CURRENT_DATE - 28 AND CURRENT_DATE - 1
GROUP BY dow, weekday, hour
ORDER BY dow, hour;

SELECT weekday, hour, bookings FROM r_peak_hours ORDER BY bookings DESC LIMIT 10;

CREATE OR REPLACE VIEW r_repeat_no_shows AS
SELECT m.reg_no, m.full_name, m.department, COUNT(*) AS bookings_marked,
       COUNT(*) FILTER (WHERE a.is_no_show) AS no_shows,
       ROUND(100.0 * AVG(a.is_no_show::int), 1) AS no_show_pct
FROM attendance a
JOIN booking b ON b.booking_id = a.booking_id
JOIN member m ON m.member_id = b.member_id
GROUP BY m.member_id, m.reg_no, m.full_name, m.department
HAVING COUNT(*) FILTER (WHERE a.is_no_show) >= 3
ORDER BY no_shows DESC, no_show_pct DESC;

SELECT * FROM r_repeat_no_shows;

CREATE OR REPLACE VIEW r_play_time AS
SELECT c.sport, COUNT(*) AS sessions,
       ROUND(EXTRACT(EPOCH FROM AVG(a.check_out - a.check_in)) / 60) AS avg_minutes
FROM attendance a
JOIN booking b ON b.booking_id = a.booking_id
JOIN slot s ON s.slot_id = b.slot_id
JOIN court c ON c.court_id = s.court_id
WHERE NOT a.is_no_show AND a.check_out IS NOT NULL
GROUP BY c.sport
ORDER BY avg_minutes DESC;

SELECT * FROM r_play_time;

CREATE OR REPLACE VIEW r_complaint_hotspots AS
SELECT c.name, COUNT(*) AS complaints, COUNT(*) FILTER (WHERE cp.status <> 'RESOLVED') AS still_open
FROM complaint cp
JOIN court c ON c.court_id = cp.court_id
GROUP BY c.court_id, c.name
HAVING COUNT(*) > (
    SELECT AVG(n) FROM (
        SELECT COUNT(*) AS n FROM complaint WHERE court_id IS NOT NULL GROUP BY court_id
    ) per_court
)
ORDER BY complaints DESC;

SELECT * FROM r_complaint_hotspots;

CREATE OR REPLACE VIEW r_event_fill AS
SELECT e.name, e.sport, e.start_date, e.capacity, COUNT(r.registration_id) AS registered,
       ROUND(100.0 * COUNT(r.registration_id) / e.capacity, 1) AS fill_pct
FROM event e
LEFT JOIN event_registration r ON r.event_id = e.event_id AND r.status = 'REGISTERED'
GROUP BY e.event_id, e.name, e.sport, e.start_date, e.capacity
ORDER BY e.start_date;

SELECT * FROM r_event_fill;

CREATE OR REPLACE VIEW r_equipment_usage AS
SELECT eq.name, eq.category, eq.available_qty, eq.total_qty, COUNT(ei.eq_issue_id) AS times_issued,
       COALESCE(SUM(ei.qty_issued), 0) AS units_issued,
       COUNT(ei.eq_issue_id) FILTER (WHERE ei.return_time IS NULL AND ei.due_time < LOCALTIMESTAMP) AS overdue_now,
       COALESCE(SUM(ei.fine_amount), 0) AS fines_collected
FROM equipment eq
LEFT JOIN equipment_issue ei ON ei.equipment_id = eq.equipment_id
GROUP BY eq.equipment_id, eq.name, eq.category, eq.available_qty, eq.total_qty
ORDER BY times_issued DESC;

SELECT * FROM r_equipment_usage;

CREATE OR REPLACE VIEW r_daily_bookings AS
SELECT d::date AS day,
       COUNT(b.booking_id) FILTER (WHERE b.status IN ('COMPLETED', 'CONFIRMED')) AS played,
       COUNT(b.booking_id) FILTER (WHERE b.status = 'NO_SHOW') AS no_shows,
       COUNT(b.booking_id) FILTER (WHERE b.status = 'CANCELLED') AS cancelled
FROM generate_series(CURRENT_DATE - 27, CURRENT_DATE + 7, INTERVAL '1 day') d
LEFT JOIN slot s ON s.slot_date = d::date
LEFT JOIN booking b ON b.slot_id = s.slot_id
GROUP BY d
ORDER BY d;

SELECT * FROM r_daily_bookings WHERE day >= CURRENT_DATE - 6;

CREATE OR REPLACE VIEW r_kpis AS
SELECT
    (SELECT COUNT(*) FROM booking b JOIN slot s USING (slot_id)
     WHERE b.status <> 'CANCELLED' AND date_trunc('week', s.slot_date) = date_trunc('week', CURRENT_DATE)) AS bookings_this_week,
    (SELECT ROUND(AVG(utilisation_pct), 1) FROM r_court_utilisation) AS utilisation_pct,
    (SELECT ROUND(100.0 * AVG(is_no_show::int), 1) FROM attendance) AS no_show_pct,
    (SELECT COUNT(*) FROM v_open_complaints) AS open_complaints,
    (SELECT COUNT(*) FROM waiting_list WHERE status = 'WAITING') AS people_waiting,
    (SELECT COUNT(*) FROM member WHERE is_active) AS active_members;

SELECT * FROM r_kpis;
