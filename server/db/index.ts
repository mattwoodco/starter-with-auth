import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { account, session, user } from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const conn = postgres(process.env.DATABASE_URL);

export const db = drizzle(conn, { schema: { user, session, account } });
