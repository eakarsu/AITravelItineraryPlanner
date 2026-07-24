'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const pool = require('./config/database');

async function seedGovernedIdentity() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const schema = await client.query("SELECT to_regclass('public.travel_users') AS users_table");
    if (!schema.rows[0].users_table) throw new Error('Governed schema is missing; run the additive migration first');
    const email = process.env.SEED_ADMIN_EMAIL || process.env.DEMO_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD || process.env.DEMO_PASSWORD;
    if (!email || !password || password.length < 12) throw new Error('Seed email and a 12+ character password are required');
    const name = process.env.BOOTSTRAP_ADMIN_NAME || 'Demo Traveler';
    const tenantName = process.env.BOOTSTRAP_TENANT_NAME || 'Development Tenant';
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await client.query(
      'INSERT INTO travel_users(email,password_hash,name) VALUES($1,$2,$3) ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,name=EXCLUDED.name RETURNING id',
      [email, passwordHash, name],
    );
    let tenant = await client.query('SELECT id FROM travel_tenants WHERE name=$1 ORDER BY id LIMIT 1', [tenantName]);
    if (!tenant.rows[0]) tenant = await client.query('INSERT INTO travel_tenants(name) VALUES($1) RETURNING id', [tenantName]);
    await client.query(
      "INSERT INTO travel_memberships(tenant_id,user_id,role,active) VALUES($1,$2,'admin',TRUE) ON CONFLICT(tenant_id,user_id) DO UPDATE SET role='admin',active=TRUE",
      [tenant.rows[0].id, user.rows[0].id],
    );
    await client.query('COMMIT');
    console.log(`Governed development login seeded for ${email}.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedGovernedIdentity().catch(error => { console.error('Governed seed failed:', error.message); process.exitCode = 1; });
