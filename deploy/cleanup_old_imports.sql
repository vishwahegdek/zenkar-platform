-- Transactional Data Cleanup for Old Imports (Phase 2: Cleanup)
-- Run this ONLY after verifying Phase 1 was successful.
-- This script unlinks Recipients and deletes orphaned Recipient records.

BEGIN;

-- 1. Unlink Recipients from 'Old Imports' Expenses
--    Safety: Only unlinks if a VALID labourer_id is already set (proving Phase 1 worked).
UPDATE expenses
SET recipient_id = NULL
WHERE description = 'Old Imports'
  AND recipient_id IS NOT NULL
  AND labourer_id IS NOT NULL;

-- 2. Delete Recipients that are now orphaned
--    Logic: Delete any Recipient that is no longer referenced by ANY expense.
DELETE FROM recipients
WHERE id NOT IN (
    SELECT DISTINCT recipient_id 
    FROM expenses 
    WHERE recipient_id IS NOT NULL
);

COMMIT;
