SELECT setseed(0.42);

INSERT INTO staff (emp_code, full_name, designation, contact_no) VALUES
('STF101', 'Ramesh K', 'Counter Staff', '9845000101'),
('STF102', 'Lakshmi N', 'Counter Staff', '9845000102'),
('STF103', 'Manjunath B', 'Equipment In-charge', '9845000103'),
('ADM001', 'Dr. Suresh Kumar', 'Director, Physical Education', '9845000001');

INSERT INTO member (reg_no, full_name, member_type, department, contact_no, email) VALUES
('PES1UG24CS101', 'Aarav Sharma', 'STUDENT', 'CSE', '9876500001', 'aarav.sharma@stu.pes.edu'),
('PES1UG24CS117', 'Diya Nair', 'STUDENT', 'CSE', '9876500002', 'diya.nair@stu.pes.edu'),
('PES1UG24CS142', 'Rohan Gupta', 'STUDENT', 'CSE', '9876500003', 'rohan.gupta@stu.pes.edu'),
('PES1UG24EC055', 'Sneha Rao', 'STUDENT', 'ECE', '9876500004', 'sneha.rao@stu.pes.edu'),
('PES1UG24EC078', 'Karthik Iyer', 'STUDENT', 'ECE', '9876500005', 'karthik.iyer@stu.pes.edu'),
('PES1UG24AM021', 'Ananya Reddy', 'STUDENT', 'AIML', '9876500006', 'ananya.reddy@stu.pes.edu'),
('PES1UG24AM064', 'Vikram Joshi', 'STUDENT', 'AIML', '9876500007', 'vikram.joshi@stu.pes.edu'),
('PES1UG24ME012', 'Priya Menon', 'STUDENT', 'ME', '9876500008', 'priya.menon@stu.pes.edu'),
('PES1UG24ME039', 'Arjun Patil', 'STUDENT', 'ME', '9876500009', 'arjun.patil@stu.pes.edu'),
('FAC1024', 'Kavya Shetty', 'FACULTY', 'CSE', '9876500010', 'kavya.shetty@pes.edu'),
('PES1UG24AM083', 'Dhanush Shankar Reddy', 'STUDENT', 'AIML', '9876500011', 'dhanush.reddy@stu.pes.edu'),
('PES1UG24AM082', 'Dhanush S S', 'STUDENT', 'AIML', '9876500012', 'dhanush.ss@stu.pes.edu');

INSERT INTO member (reg_no, full_name, member_type, department, contact_no, email)
SELECT 'PES1UG24' || d.code || lpad((200 + i)::text, 3, '0'), n.f || ' ' || n.l, 'STUDENT', d.dept,
       '98765' || lpad((100 + i)::text, 5, '0'), lower(n.f) || '.' || lower(n.l) || '@stu.pes.edu'
FROM generate_series(0, 47) i
CROSS JOIN LATERAL (
    SELECT (ARRAY['Aditya', 'Bhavana', 'Chetan', 'Deepika', 'Eshwar', 'Gayathri', 'Harsha', 'Ishita', 'Jayanth', 'Keerthana', 'Lokesh', 'Meghana',
                  'Nikhil', 'Pooja', 'Rahul', 'Sanjana', 'Tejas', 'Varsha', 'Yash', 'Shreya', 'Manoj', 'Nandini', 'Pranav', 'Ritika'])[1 + i % 24] AS f,
           (ARRAY['Kulkarni', 'Hegde', 'Bhat', 'Naidu', 'Pillai', 'Desai', 'Rao', 'Kumar', 'Shenoy', 'Murthy', 'Gowda', 'Prasad'])[1 + (i / 24) * 6 + i % 6] AS l
) n
CROSS JOIN LATERAL (
    SELECT (ARRAY['CS', 'EC', 'AM', 'ME', 'EE', 'BT'])[1 + i % 6] AS code,
           (ARRAY['CSE', 'ECE', 'AIML', 'ME', 'EEE', 'BT'])[1 + i % 6] AS dept
) d;

INSERT INTO app_user (username, password_hash, role, member_id)
SELECT reg_no, crypt('kreeda123', gen_salt('bf', 8)), 'MEMBER', member_id FROM member;

INSERT INTO app_user (username, password_hash, role, staff_id)
SELECT emp_code, crypt('kreeda123', gen_salt('bf', 8)), CASE WHEN emp_code LIKE 'ADM%' THEN 'ADMIN' ELSE 'STAFF' END, staff_id FROM staff;

INSERT INTO court (name, sport, location, capacity, open_time, close_time, peak_start, peak_end) VALUES
('Badminton Court 1', 'Badminton', 'Indoor Stadium', 4, '06:00', '21:00', '17:00', '21:00'),
('Badminton Court 2', 'Badminton', 'Indoor Stadium', 4, '06:00', '21:00', '17:00', '21:00'),
('Badminton Court 3', 'Badminton', 'Indoor Stadium', 4, '06:00', '21:00', '17:00', '21:00'),
('Tennis Court 1', 'Tennis', 'Outdoor Block A', 4, '06:00', '19:00', '16:00', '19:00'),
('Tennis Court 2', 'Tennis', 'Outdoor Block A', 4, '06:00', '19:00', '16:00', '19:00'),
('Basketball Court', 'Basketball', 'Outdoor Block B', 10, '06:00', '21:00', '17:00', '21:00');

INSERT INTO equipment (equip_code, name, category, total_qty, available_qty) VALUES
('EQ01', 'Badminton Racket', 'Badminton', 20, 20),
('EQ02', 'Shuttlecock Tube', 'Badminton', 30, 30),
('EQ03', 'Tennis Racket', 'Tennis', 10, 10),
('EQ04', 'Tennis Ball Can', 'Tennis', 15, 15),
('EQ05', 'Basketball', 'Basketball', 8, 8),
('EQ06', 'Table Tennis Bat', 'Table Tennis', 12, 12);

INSERT INTO locker_key (key_code, key_section)
SELECT s.prefix || lpad(n::text, 2, '0'), s.section
FROM (VALUES ('A', 'Men''s Locker Room'), ('B', 'Women''s Locker Room')) s(prefix, section)
CROSS JOIN generate_series(1, 12) n;

SELECT generate_slots(CURRENT_DATE - 28, CURRENT_DATE + 7);

INSERT INTO event (created_by, name, sport, start_date, end_date, capacity, description) VALUES
(4, 'PES Basketball 3x3 Cup', 'Basketball', CURRENT_DATE - 14, CURRENT_DATE - 13, 24,
 'Fast three-a-side half court tournament between department teams. Competitive, knockout format.');

INSERT INTO court_block (event_id, court_id, block_date, start_time, end_time, reason)
SELECT 1, 6, d::date, '15:00', '21:00', 'Tournament' FROM generate_series(CURRENT_DATE - 14, CURRENT_DATE - 13, INTERVAL '1 day') d;

ALTER TABLE event_registration DISABLE TRIGGER event_capacity;
INSERT INTO event_registration (event_id, member_id, registered_on)
SELECT 1, member_id, LOCALTIMESTAMP - INTERVAL '20 days' + random() * INTERVAL '4 days'
FROM member WHERE member_type = 'STUDENT' ORDER BY random() LIMIT 24;
ALTER TABLE event_registration ENABLE TRIGGER event_capacity;

DO $$
DECLARE
    s RECORD;
    p FLOAT;
    h INT;
    pick INT;
    start_at TIMESTAMP;
BEGIN
    FOR s IN
        SELECT sl.slot_id, sl.court_id, sl.slot_date, sl.start_time, c.sport
        FROM slot sl JOIN court c ON c.court_id = sl.court_id
        WHERE sl.status = 'OPEN'
        ORDER BY sl.slot_date, sl.start_time, sl.court_id
    LOOP
        h := EXTRACT(HOUR FROM s.start_time);
        p := CASE WHEN h BETWEEN 17 AND 20 THEN 0.85 WHEN h IN (6, 7) THEN 0.6 WHEN h IN (8, 16) THEN 0.4 ELSE 0.15 END;
        IF s.sport = 'Tennis' AND h >= 16 THEN
            p := 0.8;
        END IF;
        IF EXTRACT(ISODOW FROM s.slot_date) IN (6, 7) THEN
            p := p * 0.7 + 0.15;
        END IF;
        start_at := s.slot_date + s.start_time;
        IF start_at > LOCALTIMESTAMP THEN
            p := p * (0.75 - 0.08 * (s.slot_date - CURRENT_DATE));
        END IF;
        CONTINUE WHEN random() > p;

        SELECT m.member_id INTO pick
        FROM member m
        WHERE m.is_active
          AND NOT EXISTS (
              SELECT 1 FROM booking b JOIN slot x USING (slot_id)
              WHERE b.member_id = m.member_id AND b.status <> 'CANCELLED'
                AND x.slot_date = s.slot_date AND x.start_time = s.start_time)
          AND (SELECT count(*) FROM booking b JOIN slot x USING (slot_id) JOIN court y ON y.court_id = x.court_id
               WHERE b.member_id = m.member_id AND b.status <> 'CANCELLED'
                 AND x.slot_date = s.slot_date AND y.sport = s.sport) < 2
          AND (NOT is_peak(s.court_id, s.start_time)
               OR (SELECT count(*) FROM booking b JOIN slot x USING (slot_id)
                   WHERE b.member_id = m.member_id AND b.status <> 'CANCELLED'
                     AND date_trunc('week', x.slot_date) = date_trunc('week', s.slot_date)
                     AND is_peak(x.court_id, x.start_time)) < 3)
        ORDER BY random() / (1 + m.member_id % 4)
        LIMIT 1;

        CONTINUE WHEN pick IS NULL;
        INSERT INTO booking (slot_id, member_id, booked_at)
        VALUES (s.slot_id, pick, start_at - INTERVAL '1 hour' - random() * INTERVAL '60 hours');
    END LOOP;
END $$;

UPDATE booking b
SET status = 'CANCELLED', cancelled_at = b.booked_at + random() * INTERVAL '30 minutes', cancel_reason = 'Cancelled by member'
FROM slot s
WHERE s.slot_id = b.slot_id AND s.slot_date + s.start_time < LOCALTIMESTAMP AND random() < 0.06;

INSERT INTO attendance (booking_id, marked_by, check_in, check_out, is_no_show)
SELECT booking_id,
       CASE WHEN ns THEN NULL ELSE 1 + booking_id % 2 END,
       CASE WHEN ns THEN NULL ELSE start_at + random() * INTERVAL '10 minutes' END,
       CASE WHEN ns THEN NULL ELSE LEAST(start_at + play, LOCALTIMESTAMP) END,
       ns
FROM (
    SELECT b.booking_id, s.slot_date + s.start_time AS start_at,
           random() < CASE WHEN b.member_id % 9 = 0 THEN 0.35 ELSE 0.07 END AS ns,
           CASE c.sport WHEN 'Badminton' THEN INTERVAL '32 minutes' WHEN 'Tennis' THEN INTERVAL '44 minutes' ELSE INTERVAL '38 minutes' END
               + random() * INTERVAL '16 minutes' AS play
    FROM booking b JOIN slot s ON s.slot_id = b.slot_id JOIN court c ON c.court_id = s.court_id
    WHERE b.status = 'CONFIRMED' AND s.slot_date + s.start_time + INTERVAL '15 minutes' < LOCALTIMESTAMP
) t;

INSERT INTO event (created_by, name, sport, start_date, end_date, capacity, description) VALUES
(4, 'Inter-Department Badminton Open', 'Badminton', CURRENT_DATE + 3, CURRENT_DATE + 4, 32,
 'Singles and doubles knockout between departments. Open to all levels, matches every morning.'),
(4, 'Freshers Tennis Friendly', 'Tennis', CURRENT_DATE + 5, CURRENT_DATE + 5, 16,
 'Relaxed, beginner friendly tennis morning just for fun. Rackets and balls provided, no experience needed.'),
(4, 'State-Level Badminton Trials Selection', 'Badminton', CURRENT_DATE + 6, CURRENT_DATE + 6, 12,
 'Serious selection trials for advanced players aiming for the state team. Competitive singles only.');

INSERT INTO court_block (event_id, court_id, block_date, start_time, end_time, reason)
SELECT 2, c, d::date, '08:00', '12:00', 'Tournament'
FROM generate_series(CURRENT_DATE + 3, CURRENT_DATE + 4, INTERVAL '1 day') d CROSS JOIN (VALUES (1), (2)) v(c);

INSERT INTO court_block (event_id, court_id, block_date, start_time, end_time, reason) VALUES
(3, 4, CURRENT_DATE + 5, '06:00', '10:00', 'Event'),
(4, 3, CURRENT_DATE + 6, '16:00', '19:00', 'Trials'),
(NULL, 5, CURRENT_DATE + 2, '06:00', '09:00', 'Surface repair on the baseline');

INSERT INTO event_registration (event_id, member_id, registered_on)
SELECT 2, member_id, LOCALTIMESTAMP - random() * INTERVAL '3 days' FROM member WHERE member_type = 'STUDENT' ORDER BY random() LIMIT 18;
INSERT INTO event_registration (event_id, member_id, registered_on)
SELECT 3, member_id, LOCALTIMESTAMP - random() * INTERVAL '3 days' FROM member WHERE member_type = 'STUDENT' ORDER BY random() LIMIT 9;
INSERT INTO event_registration (event_id, member_id, registered_on)
SELECT 4, member_id, LOCALTIMESTAMP - random() * INTERVAL '3 days' FROM member WHERE member_type = 'STUDENT' AND member_id NOT IN (11, 12) ORDER BY random() LIMIT 12;

DO $$
DECLARE
    s RECORD;
    w RECORD;
BEGIN
    FOR s IN
        SELECT slot_id FROM slot
        WHERE status = 'BOOKED' AND slot_date > CURRENT_DATE AND is_peak(court_id, start_time)
        ORDER BY random() LIMIT 14
    LOOP
        FOR w IN
            SELECT member_id FROM member
            WHERE member_id NOT IN (SELECT member_id FROM booking WHERE slot_id = s.slot_id AND status = 'CONFIRMED')
            ORDER BY random() LIMIT (1 + floor(random() * 3))::int
        LOOP
            PERFORM join_waitlist(w.member_id, s.slot_id);
        END LOOP;
    END LOOP;
END $$;

DO $$
DECLARE
    s RECORD;
BEGIN
    FOR s IN
        SELECT slot_id FROM slot
        WHERE status = 'OPEN' AND slot_date BETWEEN CURRENT_DATE + 1 AND CURRENT_DATE + 2 AND start_time BETWEEN '06:00' AND '08:00'
        ORDER BY slot_date, start_time
    LOOP
        BEGIN
            PERFORM book_slot(11, s.slot_id);
            EXIT;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;

    FOR s IN
        SELECT b.slot_id FROM booking b JOIN slot x USING (slot_id)
        WHERE b.status = 'CONFIRMED' AND b.member_id NOT IN (11, 12) AND x.slot_date > CURRENT_DATE AND is_peak(x.court_id, x.start_time)
        ORDER BY x.slot_date, x.start_time LIMIT 2
    LOOP
        PERFORM join_waitlist(11, s.slot_id);
    END LOOP;
END $$;

INSERT INTO game_post (member_id, sport, post_text, preferred_time, is_open, posted_at) VALUES
(3, 'Badminton', 'Looking for a doubles partner for casual evening games, I am intermediate and just want to have fun', 'Weekday evenings', TRUE, LOCALTIMESTAMP - INTERVAL '2 days'),
(15, 'Badminton', 'Need two more players for relaxed doubles after 6 pm, beginners welcome', 'After 6 PM', TRUE, LOCALTIMESTAMP - INTERVAL '1 day'),
(6, 'Badminton', 'Want to practise smashes and footwork seriously, preparing for the inter-department open', 'Mornings 6-8', TRUE, LOCALTIMESTAMP - INTERVAL '3 days'),
(22, 'Tennis', 'Beginner tennis player, never played a proper match, need someone patient to rally with', 'Weekends', TRUE, LOCALTIMESTAMP - INTERVAL '4 days'),
(30, 'Tennis', 'Looking for a competitive singles opponent, I play at a good level and want long rallies', 'Evenings 4-7', TRUE, LOCALTIMESTAMP - INTERVAL '2 days'),
(11, 'Basketball', 'Getting a 3v3 half court game together this week, need three more who can run', 'Thursday evening', TRUE, LOCALTIMESTAMP - INTERVAL '5 hours'),
(40, 'Basketball', 'Anyone up for shooting practice and a casual pickup game, nothing serious', 'After classes', TRUE, LOCALTIMESTAMP - INTERVAL '1 day'),
(5, 'Badminton', 'Early morning badminton before class, singles or doubles, decent level', '6-7 AM', TRUE, LOCALTIMESTAMP - INTERVAL '6 days'),
(12, 'Tennis', 'Want to learn tennis basics, looking for someone experienced who can teach a bit', 'Saturday morning', TRUE, LOCALTIMESTAMP - INTERVAL '3 days'),
(25, 'Badminton', 'Fun doubles in the evening, not too competitive, just to unwind after labs', '7-8 PM', TRUE, LOCALTIMESTAMP - INTERVAL '8 hours'),
(33, 'Basketball', 'Looking for players for a serious full-court game, fit and regular players only', 'Friday 5 PM', TRUE, LOCALTIMESTAMP - INTERVAL '2 days'),
(18, 'Badminton', 'Mixed doubles partner needed for the upcoming tournament, should be good at net play', 'Evenings', TRUE, LOCALTIMESTAMP - INTERVAL '1 day'),
(44, 'Tennis', 'Doubles tennis for fun, any skill level, I will bring balls', 'Sunday evening', TRUE, LOCALTIMESTAMP - INTERVAL '4 days'),
(8, 'Badminton', 'Beginner, want to learn badminton properly, need a friendly partner', 'Weekday mornings', TRUE, LOCALTIMESTAMP - INTERVAL '12 hours'),
(27, 'Badminton', 'Singles practice partner for footwork drills, advanced level', 'Early mornings', FALSE, LOCALTIMESTAMP - INTERVAL '15 days');

INSERT INTO complaint (member_id, court_id, equipment_id, complaint_text, status, reported_on) VALUES
(4, 2, NULL, 'The net on Badminton Court 2 is torn in the middle, shuttles go right through', 'OPEN', LOCALTIMESTAMP - INTERVAL '6 days'),
(22, 4, NULL, 'Floodlights on Tennis Court 1 keep flickering after 6 pm, hard to see the ball', 'IN_PROGRESS', LOCALTIMESTAMP - INTERVAL '9 days'),
(40, 6, NULL, 'The basketball hoop rim on the north side is loose and wobbles', 'OPEN', LOCALTIMESTAMP - INTERVAL '4 days'),
(6, NULL, 2, 'Shuttlecocks issued at the counter have broken feathers, they wobble in the air', 'OPEN', LOCALTIMESTAMP - INTERVAL '8 days'),
(8, 1, NULL, 'Floor near the service line on Badminton Court 1 is slippery, someone almost fell', 'RESOLVED', LOCALTIMESTAMP - INTERVAL '20 days'),
(15, 3, NULL, 'Water dispenser next to Badminton Court 3 is not working', 'OPEN', LOCALTIMESTAMP - INTERVAL '1 day'),
(50, NULL, 3, 'Two tennis rackets at the counter have broken strings', 'RESOLVED', LOCALTIMESTAMP - INTERVAL '15 days'),
(12, 5, NULL, 'Tennis Court 2 has cracks on the baseline surface', 'IN_PROGRESS', LOCALTIMESTAMP - INTERVAL '10 days'),
(19, NULL, 5, 'Basketballs are under-inflated, they barely bounce', 'OPEN', LOCALTIMESTAMP - INTERVAL '3 days'),
(2, 1, NULL, 'Scoreboard on Badminton Court 1 is missing numbers', 'RESOLVED', LOCALTIMESTAMP - INTERVAL '25 days'),
(36, 6, NULL, 'Basketball court lights are too dim at night', 'OPEN', LOCALTIMESTAMP - INTERVAL '5 days');

INSERT INTO complaint (member_id, court_id, equipment_id, complaint_text, status, reported_on, duplicate_of) VALUES
(17, 2, NULL, 'Badminton court two net is sagging and has a big hole', 'OPEN', LOCALTIMESTAMP - INTERVAL '5 days', 1),
(29, 2, NULL, 'Net problem on the second badminton court, it is ripped near the post', 'OPEN', LOCALTIMESTAMP - INTERVAL '3 days', 1),
(11, 2, NULL, 'Court 2 badminton net is broken, please replace it', 'OPEN', LOCALTIMESTAMP - INTERVAL '1 day', 1),
(30, 4, NULL, 'Lights at the first tennis court go on and off during evening games', 'IN_PROGRESS', LOCALTIMESTAMP - INTERVAL '7 days', 2),
(33, 6, NULL, 'North basket ring is shaky, could fall off during a dunk', 'OPEN', LOCALTIMESTAMP - INTERVAL '2 days', 3),
(25, NULL, 2, 'Shuttles from the counter are damaged and fly badly', 'OPEN', LOCALTIMESTAMP - INTERVAL '6 days', 4),
(1, NULL, 2, 'The Mavis shuttles break after a few rallies, quality is poor', 'OPEN', LOCALTIMESTAMP - INTERVAL '2 days', 4);

DO $$
DECLARE
    i INT;
    t TIMESTAMP;
    eq INT;
    new_id INT;
BEGIN
    FOR i IN 1..45 LOOP
        t := date_trunc('hour', LOCALTIMESTAMP - INTERVAL '1 day' - random() * INTERVAL '25 days');
        t := t::date + make_interval(hours => 7 + floor(random() * 12)::int);
        eq := 1 + floor(random() * 6)::int;
        INSERT INTO equipment_issue (equipment_id, member_id, issued_by, qty_issued, issue_time, due_time)
        VALUES (eq, 1 + floor(random() * 60)::int, 1 + floor(random() * 3)::int, 1 + floor(random() * 2)::int, t, t + INTERVAL '2 hours')
        RETURNING eq_issue_id INTO new_id;
        UPDATE equipment_issue
        SET return_time = t + INTERVAL '50 minutes' + CASE WHEN random() < 0.2 THEN random() * INTERVAL '4 hours' ELSE random() * INTERVAL '60 minutes' END
        WHERE eq_issue_id = new_id;
    END LOOP;

    FOR i IN 1..30 LOOP
        t := LOCALTIMESTAMP - INTERVAL '1 day' - random() * INTERVAL '25 days';
        INSERT INTO key_issue (key_id, member_id, issued_by, in_time)
        VALUES (1 + floor(random() * 24)::int, 1 + floor(random() * 60)::int, 1 + floor(random() * 2)::int, t)
        RETURNING key_issue_id INTO new_id;
        UPDATE key_issue SET out_time = t + INTERVAL '45 minutes' + random() * INTERVAL '90 minutes' WHERE key_issue_id = new_id;
    END LOOP;
END $$;

INSERT INTO equipment_issue (equipment_id, member_id, issued_by, qty_issued, issue_time, due_time) VALUES
(1, 11, 3, 2, LOCALTIMESTAMP - INTERVAL '40 minutes', LOCALTIMESTAMP + INTERVAL '80 minutes'),
(2, 11, 3, 1, LOCALTIMESTAMP - INTERVAL '40 minutes', LOCALTIMESTAMP + INTERVAL '80 minutes'),
(5, 33, 3, 1, LOCALTIMESTAMP - INTERVAL '3 hours', LOCALTIMESTAMP - INTERVAL '1 hour'),
(3, 30, 1, 1, LOCALTIMESTAMP - INTERVAL '5 hours', LOCALTIMESTAMP - INTERVAL '3 hours'),
(4, 22, 1, 1, LOCALTIMESTAMP - INTERVAL '1 hour', LOCALTIMESTAMP + INTERVAL '1 hour'),
(1, 6, 2, 1, LOCALTIMESTAMP - INTERVAL '20 minutes', LOCALTIMESTAMP + INTERVAL '100 minutes');

INSERT INTO key_issue (key_id, member_id, issued_by, in_time) VALUES
(3, 11, 1, LOCALTIMESTAMP - INTERVAL '35 minutes'),
(7, 5, 1, LOCALTIMESTAMP - INTERVAL '1 hour'),
(14, 4, 2, LOCALTIMESTAMP - INTERVAL '50 minutes'),
(18, 8, 2, LOCALTIMESTAMP - INTERVAL '20 minutes'),
(9, 40, 1, LOCALTIMESTAMP - INTERVAL '3 hours');
