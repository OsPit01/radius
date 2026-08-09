import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
});
const rows = await sql`
  select id, title, city, street, "numberHome", district, building, "formattedAddress"
  from radius_apartment
  order by id
`;
for (const r of rows) {
  console.log(`id=${r.id}`);
  console.log(`  title           : ${r.title}`);
  console.log(`  city            : ${r.city}`);
  console.log(`  street          : ${r.street}`);
  console.log(`  numberHome      : ${r.numberHome}`);
  console.log(`  district        : ${r.district}`);
  console.log(`  building        : ${r.building}`);
  console.log(`  formattedAddress: ${r.formattedAddress}`);
  console.log("");
}
await sql.end();
