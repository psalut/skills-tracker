import pg from 'pg';
const { Client } = pg;

function shouldUseSsl(connectionString: string): boolean {
  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get('sslmode')?.toLowerCase();
    const ssl = url.searchParams.get('ssl')?.toLowerCase();

    return (
      sslMode === 'require' ||
      sslMode === 'verify-ca' ||
      sslMode === 'verify-full' ||
      ssl === 'true' ||
      ssl === '1'
    );
  } catch {
    return false;
  }
}

export async function resetDatabase(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is missing');

  const client = new Client(
    shouldUseSsl(connectionString)
      ? {
          connectionString,
          ssl: { rejectUnauthorized: false },
        }
      : {
          connectionString,
        },
  );

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
