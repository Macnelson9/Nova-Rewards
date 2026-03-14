const { Pool } = require('pg');

// Single shared connection pool for the entire backend
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Executes a parameterized SQL query against the PostgreSQL database.
 *
 * @param {string} text   - SQL query string with $1, $2 ... placeholders
 * @param {Array}  params - Parameter values
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
