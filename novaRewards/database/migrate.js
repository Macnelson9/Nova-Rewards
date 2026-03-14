require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrations = [
  '001_create_merchants.sql',
  '002_create_users.sql',
  '003_create_campaigns.sql',
  '004_create_transactions.sql',
];

async function migrate() {
  const client = await pool.connect();
  try {
    for (const file of migrations) {
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
      console.log(`Running migration: ${file}`);
      await client.query(sql);
      console.log(`  Done.`);
    }
    console.log('All migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
