/**
 * One-time first-admin bootstrap.
 * Usage: BOOTSTRAP_ADMIN_EMAIL=you@example.com CLERK_SECRET_KEY=sk_... node scripts/bootstrap-admin.mjs
 * The target must already have a normal Clerk account. Keep the secret key private.
 */
const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const secret = process.env.CLERK_SECRET_KEY;
if (!email || !secret) {
  console.error('Set BOOTSTRAP_ADMIN_EMAIL and CLERK_SECRET_KEY before running this script.');
  process.exit(1);
}
const headers = { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' };
const listUrl = new URL('https://api.clerk.com/v1/users');
listUrl.searchParams.append('email_address[]', email);
listUrl.searchParams.set('limit', '1');
const response = await fetch(listUrl, { headers });
if (!response.ok) throw new Error(`Clerk user lookup failed (${response.status}): ${await response.text()}`);
const users = await response.json();
const user = users[0];
if (!user) throw new Error(`No Clerk user found for ${email}. Register normally first.`);
const update = await fetch(`https://api.clerk.com/v1/users/${user.id}/metadata`, {
  method: 'PATCH', headers,
  body: JSON.stringify({ public_metadata: { ...(user.public_metadata ?? {}), role: 'super_admin' } }),
});
if (!update.ok) throw new Error(`Could not assign Super Admin (${update.status}): ${await update.text()}`);
console.log(`Super Admin assigned to ${email}. Remove BOOTSTRAP_ADMIN_EMAIL from deployment secrets after this one-time operation.`);
