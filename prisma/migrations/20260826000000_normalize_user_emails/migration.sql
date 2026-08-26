-- Better Auth compares email addresses in normalized lowercase form.
-- Keep both the user identity and credential account identity canonical.
UPDATE "User"
SET "email" = lower(trim("email"));

UPDATE "Account"
SET "accountId" = lower(trim("accountId"))
WHERE "providerId" = 'credential';
