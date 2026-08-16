import "dotenv/config";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL not set");
const sql = postgres(databaseUrl, {
  ssl: { rejectUnauthorized: false },
});

try {
  console.log("Adding new columns to users table...");

  await sql.unsafe(`
    ALTER TABLE radius_user
    ADD COLUMN IF NOT EXISTS phone varchar(50),
    ADD COLUMN IF NOT EXISTS "firstName" varchar(100),
    ADD COLUMN IF NOT EXISTS "lastName" varchar(100),
    ADD COLUMN IF NOT EXISTS patronymic varchar(100);
  `);

  console.log("Done! Columns added.");
} catch (err) {
  console.error("Error:", err);
} finally {
  await sql.end();
}
