-- Add service tracking fields to ac_assets
-- Required for Next Service Date display and Overdue indicator in AC Dashboard

ALTER TABLE ac_assets ADD COLUMN IF NOT EXISTS next_service DATE;
ALTER TABLE ac_assets ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE ac_assets ADD COLUMN IF NOT EXISTS warranty_expiry DATE;

-- Allow public update for ac_assets (needed to write next_service after logging)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'ac_assets' AND policyname = 'Public Update Access'
    ) THEN
        CREATE POLICY "Public Update Access" ON ac_assets FOR UPDATE USING (true) WITH CHECK (true);
    END IF;
END $$;
