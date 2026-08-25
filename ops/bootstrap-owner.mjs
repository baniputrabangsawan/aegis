import "dotenv/config";
import { randomUUID } from "node:crypto";
import pg from "pg";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const organizationName = process.env.ORGANIZATION_NAME?.trim() || "Aegis Workspace";
const organizationSlug = process.env.ORGANIZATION_SLUG?.trim().toLowerCase() || "aegis-workspace";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
if (!email) throw new Error("ADMIN_EMAIL is required");
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(organizationSlug)) throw new Error("ORGANIZATION_SLUG must use lowercase letters, numbers, and hyphens");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("BEGIN");
  const userResult = await client.query('SELECT id, email FROM admin_users WHERE lower(email) = $1 LIMIT 1', [email]);
  if (userResult.rowCount !== 1) throw new Error(`Admin user ${email} does not exist. Sign in or seed the admin account first.`);
  const userId = userResult.rows[0].id;

  const organizationResult = await client.query('SELECT id FROM organizations WHERE slug = $1 LIMIT 1', [organizationSlug]);
  let organizationId = organizationResult.rows[0]?.id;
  if (!organizationId) {
    organizationId = `org_${randomUUID().replaceAll("-", "")}`;
    await client.query('INSERT INTO organizations (id, name, slug, "createdAt") VALUES ($1, $2, $3, NOW())', [organizationId, organizationName, organizationSlug]);
  }

  await client.query(
    'INSERT INTO organization_members (id, "organizationId", "userId", role, "createdAt") VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT ("organizationId", "userId") DO UPDATE SET role = EXCLUDED.role',
    [`member_${randomUUID().replaceAll("-", "")}`, organizationId, userId, "OWNER"],
  );
  await client.query('UPDATE admin_sessions SET "activeOrganizationId" = $1, "updatedAt" = NOW() WHERE "userId" = $2', [organizationId, userId]);
  await client.query("COMMIT");
  console.log(`Owner workspace ready: ${organizationName} (${organizationSlug}) for ${email}`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
