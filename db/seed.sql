-- Optional seed data for testing
INSERT INTO app_e590_tasks (user_id, title, priority, is_completed) VALUES
    ('00000000-0000-0000-0000-000000000000', 'Complete project proposal', 'high', false),
    ('00000000-0000-0000-0000-000000000000', 'Buy groceries', 'medium', true),
    ('00000000-0000-0000-0000-000000000000', 'Schedule dentist appointment', 'low', false)
ON CONFLICT (id) DO NOTHING;