-- Fixes "User is not active" on every authenticated request: the `users`
-- table never had an is_active column, so auth.middleware.ts's
-- `if (!user.is_active)` check always saw `undefined` and rejected the
-- request. Adding it with DEFAULT TRUE backfills every existing user as
-- active in the same statement.

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

COMMIT;
