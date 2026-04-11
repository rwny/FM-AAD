-- Initial Seed Data (Example)
-- Insert a sample building
INSERT INTO buildings (code, name) VALUES ('AR15', 'Building AR15 - BIM Digital Twin')
ON CONFLICT (code) DO NOTHING;
