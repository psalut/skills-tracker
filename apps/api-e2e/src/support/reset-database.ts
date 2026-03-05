import pg from 'pg';
const { Client } = pg;

export async function resetDatabase(): Promise<void> {
  const connectionString =
    process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is missing');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }, // <-- Neon
  });

  await client.connect();

  const { rows } = await client.query<{ tablename: string }>(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations';
  `);

  if (rows.length > 0) {
    const tableList = rows.map((r) => `"public"."${r.tablename}"`).join(', ');
    await client.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
  }

  await client.end();
}
