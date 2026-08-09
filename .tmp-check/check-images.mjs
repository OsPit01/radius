import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
});
const rows = await sql`
  select id, title, image, images
  from radius_apartment
  order by id
`;
for (const r of rows) {
  const mainFirst = r.image === r.images?.[0];
  console.log(`id=${r.id} | ${r.title}`);
  console.log(`  image  (главное): ${r.image?.slice(0, 40)}...`);
  console.log(`  images[0]        : ${r.images?.[0]?.slice(0, 40)}...`);
  console.log(`  image === images[0]? ${mainFirst}`);
  console.log("");
}
await sql.end();
