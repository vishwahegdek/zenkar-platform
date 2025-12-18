-- Transactional Data Fix for Old Imports (Phase 1: Populate Only)
-- This script creates Labourers and links Expenses to them.
-- It DOES NOT remove Recipient links or delete Recipients.

BEGIN;

-- 1. Insert missing Labourers from Recipients found in 'Old Imports' expenses
--    Logic: If a recipient exists in 'Old Imports' expenses but no Labourer exists with that name, create the Labourer.
INSERT INTO labourers (name, created_at, is_deleted)
SELECT DISTINCT r.name, NOW(), false
FROM expenses e
JOIN recipients r ON e.recipient_id = r.id
WHERE e.description = 'Old Imports'
  AND e.recipient_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM labourers l WHERE l.name = r.name
  );

-- 2. Update Expenses to link to the correct Labourer ID
--    Logic: Find the Labourer matching the Recipient's name and set the labourer_id.
--    Safety: Only updates 'Old Imports' where labourer_id is currently NULL.
UPDATE expenses e
SET 
    labourer_id = l.id
FROM recipients r, labourers l
WHERE e.recipient_id = r.id
  AND r.name = l.name
  AND e.description = 'Old Imports'
  AND e.labourer_id IS NULL;

COMMIT;
