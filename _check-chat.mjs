import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

const b = await sql.unsafe(
  'SELECT id, "apartmentId", "userId", status, "createdAt" FROM radius_booking ORDER BY id DESC LIMIT 5',
);
console.log("BOOKINGS:");
for (const x of b) {
  console.log(x.id, x.apartmentId, x.userId, x.status, x.createdAt.toISOString());
}

const c = await sql.unsafe(
  'SELECT id, "bookingId", "guestId", "ownerId" FROM radius_conversation ORDER BY id DESC',
);
console.log("CONVERSATIONS count:", c.length);
for (const x of c) {
  console.log(x.id, x.bookingId, x.guestId, x.ownerId);
}

await sql.end();
