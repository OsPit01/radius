import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlFile = join(__dirname, "..", "supabase", "rls.sql");
const sqlText = await readFile(sqlFile, "utf8");

const sql = postgres(process.env.DATABASE_URL);
await sql.unsafe(sqlText);
console.log("RLS включён для всех таблиц radius_*");

await sql.end();
