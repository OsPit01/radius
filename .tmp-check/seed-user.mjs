import "dotenv/config";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL not set");
const sql = postgres(databaseUrl, { ssl: { rejectUnauthorized: false } });

// Найдём владельца первой квартиры и заполним ему данные
const users = await sql`
  update radius_user
  set phone = '+375 (29) 111-22-33',
      "firstName" = 'Иван',
      "lastName" = 'Петров',
      patronymic = 'Сергеевич'
  where id in (select distinct "createdById" from radius_apartment)
  returning id, phone, "firstName", "lastName"
`;

console.log("Updated users:", users);
await sql.end();
