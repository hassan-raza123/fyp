-- Forced password change.
-- Accounts previously shared a per-role default password that lived in source
-- control; they now get a random one and must replace it before using the app.
ALTER TABLE `users`
    ADD COLUMN `must_change_password` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `password_changed_at` DATETIME(3) NULL;

-- Every existing account is still holding one of the retired shared defaults
-- (or a password derived from one), so force all of them through a reset.
-- Remove this statement if you would rather migrate accounts selectively.
UPDATE `users` SET `must_change_password` = true;

-- Official transcripts become immutable snapshots rather than a CGPA figure
-- recomputed on every read.
ALTER TABLE `transcripts`
    ADD COLUMN `data` JSON NULL;
