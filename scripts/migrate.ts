// Applies pending Drizzle migrations, then exits. Run at container startup before the app boots.
// Standalone (no $lib aliases) so it can run in the production runner image with only node_modules.
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const client = postgres(url, { ssl: 'require', max: 1 });

try {
	await migrate(drizzle(client), { migrationsFolder: './drizzle' });
	console.log('[migrate] up to date');
} finally {
	await client.end();
}
