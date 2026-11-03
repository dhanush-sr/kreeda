import pg from "pg";

pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1114, (v) => v);
pg.types.setTypeParser(1700, (v) => Number(v));
pg.types.setTypeParser(20, (v) => Number(v));

const pool = globalThis.kreedaPool ?? new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
globalThis.kreedaPool = pool;

export async function query(text, params) {
  const { rows } = await pool.query(text, params);
  return rows;
}

export async function one(text, params) {
  const rows = await query(text, params);
  return rows[0];
}

export async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export function dbError(e) {
  if (e.code === "23505") return "That was just taken by someone else.";
  if (e.code === "23514") return "That value is not allowed.";
  if (e.code === "23P01") return "That overlaps with an existing block on this court.";
  return e.message;
}

export async function close() {
  await pool.end();
}
