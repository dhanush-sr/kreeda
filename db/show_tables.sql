\dt

SELECT * FROM member;

SELECT * FROM staff;

SELECT user_id, username, role, member_id, staff_id, left(password_hash, 29) || '...' AS password_hash, last_login FROM app_user ORDER BY user_id LIMIT 15;

SELECT * FROM court;

SELECT * FROM slot WHERE slot_date = CURRENT_DATE + 1 AND court_id = 1;

SELECT * FROM booking ORDER BY booking_id DESC LIMIT 15;

SELECT * FROM waiting_list ORDER BY slot_id, position;

SELECT * FROM attendance ORDER BY attendance_id DESC LIMIT 15;

SELECT * FROM event;

SELECT * FROM event_registration ORDER BY event_id, registration_id LIMIT 15;

SELECT * FROM court_block ORDER BY block_date, court_id;

SELECT * FROM game_post;

SELECT * FROM complaint ORDER BY complaint_id;

SELECT * FROM locker_key;

SELECT * FROM key_issue ORDER BY key_issue_id DESC LIMIT 15;

SELECT * FROM equipment;

SELECT * FROM equipment_issue ORDER BY eq_issue_id DESC LIMIT 15;

SELECT 'member' AS table_name, count(*) AS rows FROM member
UNION ALL SELECT 'staff', count(*) FROM staff
UNION ALL SELECT 'app_user', count(*) FROM app_user
UNION ALL SELECT 'court', count(*) FROM court
UNION ALL SELECT 'slot', count(*) FROM slot
UNION ALL SELECT 'booking', count(*) FROM booking
UNION ALL SELECT 'waiting_list', count(*) FROM waiting_list
UNION ALL SELECT 'attendance', count(*) FROM attendance
UNION ALL SELECT 'event', count(*) FROM event
UNION ALL SELECT 'event_registration', count(*) FROM event_registration
UNION ALL SELECT 'court_block', count(*) FROM court_block
UNION ALL SELECT 'game_post', count(*) FROM game_post
UNION ALL SELECT 'complaint', count(*) FROM complaint
UNION ALL SELECT 'locker_key', count(*) FROM locker_key
UNION ALL SELECT 'key_issue', count(*) FROM key_issue
UNION ALL SELECT 'equipment', count(*) FROM equipment
UNION ALL SELECT 'equipment_issue', count(*) FROM equipment_issue;
