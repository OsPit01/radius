import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
});
const rows = await sql`
  select id, title, city, street, "numberHome", price, capacity, rooms,
         left(image, 20) as img_preview,
         array_length(images, 1) as images_count
  from radius_apartment
  order by id
`;
for (const r of rows) {
  console.log(
    `id=${r.id} | ${r.title} | ${r.city}, ${r.street} ${r.numberHome} | цена=${r.price} | кап=${r.capacity} | комн=${r.rooms} | фото=${r.images_count} | ${r.img_preview}`,
  );
}
await sql.end();
