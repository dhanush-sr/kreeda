DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE member (
    member_id SERIAL PRIMARY KEY,
    reg_no VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    member_type VARCHAR(10) NOT NULL CHECK (member_type IN ('STUDENT', 'FACULTY')),
    department VARCHAR(50) NOT NULL,
    contact_no CHAR(10) UNIQUE CHECK (contact_no ~ '^[0-9]{10}$'),
    email VARCHAR(100) UNIQUE CHECK (email LIKE '%_@_%.__%'),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE staff (
    staff_id SERIAL PRIMARY KEY,
    emp_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    designation VARCHAR(50) NOT NULL,
    contact_no CHAR(10) UNIQUE CHECK (contact_no ~ '^[0-9]{10}$')
);

CREATE TABLE app_user (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('MEMBER', 'STAFF', 'ADMIN')),
    member_id INT UNIQUE REFERENCES member(member_id) ON DELETE CASCADE,
    staff_id INT UNIQUE REFERENCES staff(staff_id) ON DELETE CASCADE,
    last_login TIMESTAMP,
    CHECK (num_nonnulls(member_id, staff_id) = 1),
    CHECK ((role = 'MEMBER') = (member_id IS NOT NULL))
);

CREATE TABLE court (
    court_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    sport VARCHAR(30) NOT NULL,
    location VARCHAR(50),
    capacity INT NOT NULL CHECK (capacity > 0),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_daily_bookings INT NOT NULL DEFAULT 2 CHECK (max_daily_bookings > 0),
    max_peak_per_week INT NOT NULL DEFAULT 3 CHECK (max_peak_per_week > 0),
    peak_start TIME NOT NULL DEFAULT '17:00',
    peak_end TIME NOT NULL DEFAULT '21:00',
    CHECK (close_time > open_time),
    CHECK (peak_end > peak_start)
);

CREATE TABLE slot (
    slot_id SERIAL PRIMARY KEY,
    court_id INT NOT NULL REFERENCES court(court_id),
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'BOOKED', 'BLOCKED')),
    CHECK (end_time > start_time),
    UNIQUE (court_id, slot_date, start_time)
);

CREATE TABLE booking (
    booking_id SERIAL PRIMARY KEY,
    slot_id INT NOT NULL REFERENCES slot(slot_id),
    member_id INT NOT NULL REFERENCES member(member_id),
    booked_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
    status VARCHAR(10) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED')),
    cancelled_at TIMESTAMP,
    cancel_reason VARCHAR(200),
    CHECK ((status = 'CANCELLED' AND cancelled_at IS NOT NULL) OR (status <> 'CANCELLED' AND cancelled_at IS NULL))
);

CREATE TABLE waiting_list (
    wait_id SERIAL PRIMARY KEY,
    slot_id INT NOT NULL REFERENCES slot(slot_id),
    member_id INT NOT NULL REFERENCES member(member_id),
    position INT NOT NULL CHECK (position > 0),
    joined_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
    status VARCHAR(10) NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'PROMOTED', 'LEFT')),
    UNIQUE (slot_id, member_id)
);

CREATE TABLE attendance (
    attendance_id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE REFERENCES booking(booking_id),
    marked_by INT REFERENCES staff(staff_id),
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    is_no_show BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK ((is_no_show AND check_in IS NULL AND check_out IS NULL) OR (NOT is_no_show AND check_in IS NOT NULL)),
    CHECK (check_out IS NULL OR check_out > check_in)
);

CREATE TABLE event (
    event_id SERIAL PRIMARY KEY,
    created_by INT NOT NULL REFERENCES staff(staff_id),
    name VARCHAR(100) NOT NULL UNIQUE,
    sport VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    description TEXT,
    CHECK (end_date >= start_date)
);

CREATE TABLE event_registration (
    registration_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    member_id INT NOT NULL REFERENCES member(member_id),
    registered_on TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
    status VARCHAR(10) NOT NULL DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED', 'CANCELLED')),
    UNIQUE (event_id, member_id)
);

CREATE TABLE court_block (
    block_id SERIAL PRIMARY KEY,
    event_id INT REFERENCES event(event_id) ON DELETE CASCADE,
    court_id INT NOT NULL REFERENCES court(court_id),
    block_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason VARCHAR(200) NOT NULL,
    CHECK (end_time > start_time),
    EXCLUDE USING gist (court_id WITH =, tsrange(block_date + start_time, block_date + end_time) WITH &&)
);

CREATE TABLE game_post (
    post_id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES member(member_id),
    sport VARCHAR(30) NOT NULL,
    post_text TEXT NOT NULL CHECK (length(post_text) >= 10),
    preferred_time VARCHAR(50),
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    posted_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
);

CREATE TABLE complaint (
    complaint_id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES member(member_id),
    court_id INT,
    equipment_id INT,
    complaint_text TEXT NOT NULL CHECK (length(complaint_text) >= 10),
    status VARCHAR(12) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')),
    reported_on TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
    duplicate_of INT REFERENCES complaint(complaint_id),
    CHECK (court_id IS NOT NULL OR equipment_id IS NOT NULL),
    CHECK (duplicate_of <> complaint_id)
);

CREATE TABLE locker_key (
    key_id SERIAL PRIMARY KEY,
    key_code VARCHAR(10) NOT NULL UNIQUE,
    key_section VARCHAR(20) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ISSUED', 'LOST'))
);

CREATE TABLE key_issue (
    key_issue_id SERIAL PRIMARY KEY,
    key_id INT NOT NULL REFERENCES locker_key(key_id),
    member_id INT NOT NULL REFERENCES member(member_id),
    issued_by INT NOT NULL REFERENCES staff(staff_id),
    in_time TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
    out_time TIMESTAMP,
    CHECK (out_time IS NULL OR out_time > in_time)
);

CREATE TABLE equipment (
    equipment_id SERIAL PRIMARY KEY,
    equip_code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(60) NOT NULL,
    category VARCHAR(30) NOT NULL,
    total_qty INT NOT NULL CHECK (total_qty >= 0),
    available_qty INT NOT NULL,
    CHECK (available_qty BETWEEN 0 AND total_qty)
);

CREATE TABLE equipment_issue (
    eq_issue_id SERIAL PRIMARY KEY,
    equipment_id INT NOT NULL REFERENCES equipment(equipment_id),
    member_id INT NOT NULL REFERENCES member(member_id),
    issued_by INT NOT NULL REFERENCES staff(staff_id),
    qty_issued INT NOT NULL CHECK (qty_issued > 0),
    issue_time TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP,
    due_time TIMESTAMP NOT NULL,
    return_time TIMESTAMP,
    fine_amount NUMERIC(8, 2) NOT NULL DEFAULT 0 CHECK (fine_amount >= 0),
    CHECK (due_time > issue_time),
    CHECK (return_time IS NULL OR return_time >= issue_time)
);

ALTER TABLE complaint ADD CONSTRAINT complaint_court_fk FOREIGN KEY (court_id) REFERENCES court(court_id);
ALTER TABLE complaint ADD CONSTRAINT complaint_equipment_fk FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id);

CREATE UNIQUE INDEX one_active_booking_per_slot ON booking (slot_id) WHERE status <> 'CANCELLED';
CREATE UNIQUE INDEX one_open_issue_per_key ON key_issue (key_id) WHERE out_time IS NULL;
CREATE UNIQUE INDEX one_key_per_member ON key_issue (member_id) WHERE out_time IS NULL;
CREATE INDEX idx_slot_date ON slot (slot_date, court_id);
CREATE INDEX idx_booking_member ON booking (member_id, status);
CREATE INDEX idx_waiting_slot ON waiting_list (slot_id, position) WHERE status = 'WAITING';
CREATE INDEX idx_complaint_status ON complaint (status);
CREATE INDEX idx_equipment_out ON equipment_issue (member_id) WHERE return_time IS NULL;

CREATE FUNCTION is_peak(p_court INT, p_time TIME) RETURNS BOOLEAN AS $$
    SELECT p_time >= peak_start AND p_time < peak_end FROM court WHERE court_id = p_court;
$$ LANGUAGE sql STABLE;

CREATE FUNCTION generate_slots(p_from DATE, p_to DATE) RETURNS INT AS $$
DECLARE
    n INT;
BEGIN
    INSERT INTO slot (court_id, slot_date, start_time, end_time)
    SELECT c.court_id, d::date, t::time, (t + INTERVAL '1 hour')::time
    FROM court c
    CROSS JOIN generate_series(p_from, p_to, INTERVAL '1 day') d
    CROSS JOIN LATERAL generate_series(DATE '2000-01-01' + c.open_time, DATE '2000-01-01' + c.close_time - INTERVAL '1 hour', INTERVAL '1 hour') t
    WHERE c.is_active
    ON CONFLICT (court_id, slot_date, start_time) DO NOTHING;
    GET DIAGNOSTICS n = ROW_COUNT;

    UPDATE slot s SET status = 'BLOCKED'
    FROM court_block b
    WHERE s.court_id = b.court_id AND s.slot_date = b.block_date
      AND s.start_time < b.end_time AND s.end_time > b.start_time AND s.status = 'OPEN';
    RETURN n;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION book_slot(p_member INT, p_slot INT) RETURNS INT AS $$
DECLARE
    s slot%ROWTYPE;
    c court%ROWTYPE;
    n INT;
    new_id INT;
BEGIN
    PERFORM 1 FROM member WHERE member_id = p_member AND is_active FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Your membership is not active';
    END IF;

    SELECT * INTO s FROM slot WHERE slot_id = p_slot;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Slot does not exist';
    END IF;
    IF s.status = 'BLOCKED' THEN
        RAISE EXCEPTION 'This slot is blocked for an event';
    END IF;
    IF s.slot_date + s.start_time <= LOCALTIMESTAMP THEN
        RAISE EXCEPTION 'This slot has already started';
    END IF;

    SELECT * INTO c FROM court WHERE court_id = s.court_id;

    IF EXISTS (
        SELECT 1 FROM booking b JOIN slot x USING (slot_id)
        WHERE b.member_id = p_member AND b.status = 'CONFIRMED'
          AND x.slot_date = s.slot_date AND x.start_time < s.end_time AND x.end_time > s.start_time
    ) THEN
        RAISE EXCEPTION 'You already have a booking at this time';
    END IF;

    SELECT count(*) INTO n
    FROM booking b JOIN slot x USING (slot_id) JOIN court y ON y.court_id = x.court_id
    WHERE b.member_id = p_member AND b.status <> 'CANCELLED'
      AND x.slot_date = s.slot_date AND y.sport = c.sport;
    IF n >= c.max_daily_bookings THEN
        RAISE EXCEPTION 'Daily limit reached: % % bookings per day', c.max_daily_bookings, c.sport;
    END IF;

    IF is_peak(c.court_id, s.start_time) THEN
        SELECT count(*) INTO n
        FROM booking b JOIN slot x USING (slot_id)
        WHERE b.member_id = p_member AND b.status <> 'CANCELLED'
          AND date_trunc('week', x.slot_date) = date_trunc('week', s.slot_date)
          AND is_peak(x.court_id, x.start_time);
        IF n >= c.max_peak_per_week THEN
            RAISE EXCEPTION 'Peak-hour limit reached: % peak bookings per week', c.max_peak_per_week;
        END IF;
    END IF;

    INSERT INTO booking (slot_id, member_id) VALUES (p_slot, p_member) RETURNING booking_id INTO new_id;
    UPDATE waiting_list SET status = 'PROMOTED' WHERE slot_id = p_slot AND member_id = p_member AND status = 'WAITING';
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION cancel_booking(p_booking INT, p_member INT) RETURNS VOID AS $$
BEGIN
    UPDATE booking b SET status = 'CANCELLED', cancelled_at = LOCALTIMESTAMP, cancel_reason = 'Cancelled by member'
    FROM slot s
    WHERE b.booking_id = p_booking AND b.member_id = p_member AND b.status = 'CONFIRMED'
      AND s.slot_id = b.slot_id AND s.slot_date + s.start_time > LOCALTIMESTAMP;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'This booking cannot be cancelled';
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION join_waitlist(p_member INT, p_slot INT) RETURNS INT AS $$
DECLARE
    pos INT;
BEGIN
    PERFORM 1 FROM slot WHERE slot_id = p_slot AND status = 'BOOKED' AND slot_date + start_time > LOCALTIMESTAMP FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'You can only join the waiting list of a booked, upcoming slot';
    END IF;
    IF EXISTS (SELECT 1 FROM booking WHERE slot_id = p_slot AND member_id = p_member AND status = 'CONFIRMED') THEN
        RAISE EXCEPTION 'You already hold this slot';
    END IF;
    SELECT COALESCE(max(position), 0) + 1 INTO pos FROM waiting_list WHERE slot_id = p_slot AND status = 'WAITING';
    INSERT INTO waiting_list (slot_id, member_id, position) VALUES (p_slot, p_member, pos)
    ON CONFLICT (slot_id, member_id) DO UPDATE SET status = 'WAITING', position = EXCLUDED.position, joined_at = LOCALTIMESTAMP;
    RETURN pos;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION mark_no_shows() RETURNS INT AS $$
DECLARE
    n INT;
BEGIN
    INSERT INTO attendance (booking_id, is_no_show)
    SELECT b.booking_id, TRUE
    FROM booking b JOIN slot s USING (slot_id)
    WHERE b.status = 'CONFIRMED'
      AND s.slot_date + s.start_time + INTERVAL '15 minutes' < LOCALTIMESTAMP;
    GET DIAGNOSTICS n = ROW_COUNT;
    RETURN n;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION trg_booking_changed() RETURNS TRIGGER AS $$
DECLARE
    w RECORD;
    slot_status VARCHAR(10);
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE slot SET status = 'BOOKED' WHERE slot_id = NEW.slot_id AND status = 'OPEN';
        RETURN NEW;
    END IF;

    IF NEW.status = 'CANCELLED' AND OLD.status <> 'CANCELLED' THEN
        SELECT status INTO slot_status FROM slot WHERE slot_id = NEW.slot_id;
        IF slot_status = 'BLOCKED' THEN
            RETURN NEW;
        END IF;

        FOR w IN
            SELECT wait_id, member_id FROM waiting_list
            WHERE slot_id = NEW.slot_id AND status = 'WAITING'
            ORDER BY position
        LOOP
            BEGIN
                PERFORM book_slot(w.member_id, NEW.slot_id);
                RETURN NEW;
            EXCEPTION WHEN OTHERS THEN
                UPDATE waiting_list SET status = 'LEFT' WHERE wait_id = w.wait_id;
            END;
        END LOOP;

        UPDATE slot SET status = 'OPEN' WHERE slot_id = NEW.slot_id AND status = 'BOOKED';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_changed
AFTER INSERT OR UPDATE OF status ON booking
FOR EACH ROW EXECUTE FUNCTION trg_booking_changed();

CREATE FUNCTION trg_attendance_check() RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM booking WHERE booking_id = NEW.booking_id AND status = 'CONFIRMED') THEN
        RAISE EXCEPTION 'Attendance can only be marked for a confirmed booking';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_check
BEFORE INSERT ON attendance
FOR EACH ROW EXECUTE FUNCTION trg_attendance_check();

CREATE FUNCTION trg_attendance_marked() RETURNS TRIGGER AS $$
BEGIN
    UPDATE booking
    SET status = CASE WHEN NEW.is_no_show THEN 'NO_SHOW' ELSE 'COMPLETED' END
    WHERE booking_id = NEW.booking_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_marked
AFTER INSERT ON attendance
FOR EACH ROW EXECUTE FUNCTION trg_attendance_marked();

CREATE FUNCTION trg_court_blocked() RETURNS TRIGGER AS $$
DECLARE
    why TEXT;
BEGIN
    SELECT COALESCE(e.name, NEW.reason) INTO why FROM (SELECT 1) x LEFT JOIN event e ON e.event_id = NEW.event_id;

    UPDATE slot SET status = 'BLOCKED'
    WHERE court_id = NEW.court_id AND slot_date = NEW.block_date
      AND start_time < NEW.end_time AND end_time > NEW.start_time;

    UPDATE booking SET status = 'CANCELLED', cancelled_at = LOCALTIMESTAMP, cancel_reason = 'Court blocked for ' || why
    WHERE status = 'CONFIRMED' AND slot_id IN (
        SELECT slot_id FROM slot
        WHERE court_id = NEW.court_id AND slot_date = NEW.block_date
          AND start_time < NEW.end_time AND end_time > NEW.start_time
    );

    UPDATE waiting_list SET status = 'LEFT'
    WHERE status = 'WAITING' AND slot_id IN (
        SELECT slot_id FROM slot
        WHERE court_id = NEW.court_id AND slot_date = NEW.block_date
          AND start_time < NEW.end_time AND end_time > NEW.start_time
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER court_blocked
AFTER INSERT ON court_block
FOR EACH ROW EXECUTE FUNCTION trg_court_blocked();

CREATE FUNCTION trg_event_capacity() RETURNS TRIGGER AS $$
DECLARE
    e event%ROWTYPE;
    n INT;
BEGIN
    SELECT * INTO e FROM event WHERE event_id = NEW.event_id FOR UPDATE;
    IF e.end_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'This event is already over';
    END IF;
    SELECT count(*) INTO n FROM event_registration WHERE event_id = NEW.event_id AND status = 'REGISTERED';
    IF n >= e.capacity THEN
        RAISE EXCEPTION 'This event is full';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_capacity
BEFORE INSERT ON event_registration
FOR EACH ROW EXECUTE FUNCTION trg_event_capacity();

CREATE FUNCTION trg_key_issued() RETURNS TRIGGER AS $$
BEGIN
    UPDATE locker_key SET status = 'ISSUED' WHERE key_id = NEW.key_id AND status = 'AVAILABLE';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'This key is not available';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER key_issued
BEFORE INSERT ON key_issue
FOR EACH ROW EXECUTE FUNCTION trg_key_issued();

CREATE FUNCTION trg_key_returned() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.out_time IS NULL AND NEW.out_time IS NOT NULL THEN
        UPDATE locker_key SET status = 'AVAILABLE' WHERE key_id = NEW.key_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER key_returned
AFTER UPDATE OF out_time ON key_issue
FOR EACH ROW EXECUTE FUNCTION trg_key_returned();

CREATE FUNCTION trg_equipment_issued() RETURNS TRIGGER AS $$
DECLARE
    left_qty INT;
BEGIN
    UPDATE equipment SET available_qty = available_qty - NEW.qty_issued
    WHERE equipment_id = NEW.equipment_id AND available_qty >= NEW.qty_issued;
    IF NOT FOUND THEN
        SELECT available_qty INTO left_qty FROM equipment WHERE equipment_id = NEW.equipment_id;
        RAISE EXCEPTION 'Only % left in stock', COALESCE(left_qty, 0);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER equipment_issued
BEFORE INSERT ON equipment_issue
FOR EACH ROW EXECUTE FUNCTION trg_equipment_issued();

CREATE FUNCTION trg_equipment_returned() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.return_time IS NULL AND NEW.return_time IS NOT NULL THEN
        UPDATE equipment SET available_qty = available_qty + NEW.qty_issued WHERE equipment_id = NEW.equipment_id;
        NEW.fine_amount := GREATEST(0, CEIL(EXTRACT(EPOCH FROM NEW.return_time - NEW.due_time) / 3600)) * 10 * NEW.qty_issued;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER equipment_returned
BEFORE UPDATE OF return_time ON equipment_issue
FOR EACH ROW EXECUTE FUNCTION trg_equipment_returned();

CREATE VIEW v_slot_board AS
SELECT s.slot_id, s.court_id, c.name AS court_name, c.sport, c.location, s.slot_date, s.start_time, s.end_time,
       s.status, b.booking_id, b.member_id AS booked_by, is_peak(c.court_id, s.start_time) AS peak,
       blk.reason AS block_reason,
       (SELECT count(*) FROM waiting_list w WHERE w.slot_id = s.slot_id AND w.status = 'WAITING') AS waiting
FROM slot s
JOIN court c ON c.court_id = s.court_id
LEFT JOIN booking b ON b.slot_id = s.slot_id AND b.status <> 'CANCELLED'
LEFT JOIN LATERAL (
    SELECT COALESCE(e.name, cb.reason) AS reason FROM court_block cb LEFT JOIN event e ON e.event_id = cb.event_id
    WHERE cb.court_id = s.court_id AND cb.block_date = s.slot_date
      AND cb.start_time < s.end_time AND cb.end_time > s.start_time
    LIMIT 1
) blk ON TRUE;

CREATE VIEW v_todays_schedule AS
SELECT b.booking_id, s.slot_date, s.start_time, s.end_time, c.name AS court_name, c.sport,
       m.member_id, m.reg_no, m.full_name, b.status, a.check_in, a.is_no_show
FROM booking b
JOIN slot s ON s.slot_id = b.slot_id
JOIN court c ON c.court_id = s.court_id
JOIN member m ON m.member_id = b.member_id
LEFT JOIN attendance a ON a.booking_id = b.booking_id
WHERE s.slot_date = CURRENT_DATE AND b.status <> 'CANCELLED';

CREATE VIEW v_member_stats AS
SELECT m.member_id,
       COUNT(b.booking_id) FILTER (WHERE b.status <> 'CANCELLED') AS total_bookings,
       COUNT(b.booking_id) FILTER (WHERE b.status = 'CONFIRMED') AS upcoming,
       COUNT(b.booking_id) FILTER (WHERE b.status <> 'CANCELLED' AND date_trunc('week', s.slot_date) = date_trunc('week', CURRENT_DATE)) AS this_week,
       COUNT(b.booking_id) FILTER (WHERE b.status <> 'CANCELLED' AND date_trunc('week', s.slot_date) = date_trunc('week', CURRENT_DATE) AND is_peak(s.court_id, s.start_time)) AS peak_this_week,
       COUNT(b.booking_id) FILTER (WHERE b.status = 'COMPLETED') AS attended,
       COUNT(b.booking_id) FILTER (WHERE b.status = 'NO_SHOW') AS no_shows,
       ROUND(100.0 * COUNT(b.booking_id) FILTER (WHERE b.status = 'COMPLETED')
             / NULLIF(COUNT(b.booking_id) FILTER (WHERE b.status IN ('COMPLETED', 'NO_SHOW')), 0), 0) AS attendance_rate
FROM member m
LEFT JOIN booking b ON b.member_id = m.member_id
LEFT JOIN slot s ON s.slot_id = b.slot_id
GROUP BY m.member_id;

CREATE VIEW v_open_complaints AS
SELECT c.complaint_id, c.complaint_text, c.status, c.reported_on, c.court_id, c.equipment_id,
       COALESCE(ct.name, e.name) AS target, m.full_name AS reported_by,
       1 + (SELECT count(*) FROM complaint d WHERE d.duplicate_of = c.complaint_id) AS reports
FROM complaint c
JOIN member m ON m.member_id = c.member_id
LEFT JOIN court ct ON ct.court_id = c.court_id
LEFT JOIN equipment e ON e.equipment_id = c.equipment_id
WHERE c.duplicate_of IS NULL AND c.status <> 'RESOLVED';
