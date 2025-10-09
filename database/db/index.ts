import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import * as schema from "./schema";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

// For query purposes
const queryClient = postgres(process.env.DATABASE_URL);
export const db = drizzle(queryClient, { schema });
