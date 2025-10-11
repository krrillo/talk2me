import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "../../shared/schema.js";

// Configure Neon to use WebSocket
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Create a connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create drizzle instance with schema
export const db = drizzle(pool, { schema });
