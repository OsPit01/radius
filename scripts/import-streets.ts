// Скрипт одноразового импорта улиц Беларуси из OpenStreetMap (Overpass API).
// Запуск: npx tsx scripts/import-streets.ts
// Не зависит от drizzle-schema (next-auth), работает напрямую через postgres-js.

import "dotenv/config";
import postgres from "postgres";
import { BELARUS_REGIONS } from "../src/lib/constants/belarus-locations";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Областные центры и Минск.
const BIG_CITIES = new Set([
  "Минск",
  "Брест",
  "Витебск",
  "Гомель",
  "Гродно",
  "Могилёв",
]);

type OverpassElement = { tags?: Record<string, string> };

async function fetchStreets(placeName: string): Promise<string[]> {
  const placeFilter = BIG_CITIES.has(placeName)
    ? '["place"="city"]'
    : '["place"~"town|city|village"]';
  // Ищем город и по оригинальному названию (Мінск), и по русскому (name:ru=Минск)
  const q = `[out:json][timeout:120];(area["name"="${placeName}"]${placeFilter}->.a;area["name:ru"="${placeName}"]${placeFilter}->.a;)->.a;way(area.a)["highway"]["name"];out body;`;

  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "User-Agent": "radius-street-import/1.0" },
      body: "data=" + encodeURIComponent(q),
    });

    // 429 — лимит запросов, 504 — перегрузка сервера: повторяем с паузой
    if (res.status === 429 || res.status === 504) {
      const wait = attempt * 5000;
      console.error(`  ⚠ ${placeName}: HTTP ${res.status}, повтор через ${wait / 1000}с`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    if (!res.ok) {
      console.error(`  ⚠ ${placeName}: HTTP ${res.status}`);
      return [];
    }

    const data = (await res.json()) as { elements: OverpassElement[] };
    const names = new Set<string>();
    for (const el of data.elements) {
      // предпочитаем русское название, иначе — исходное
      const name = el.tags?.["name:ru"] ?? el.tags?.name;
      if (name) names.add(name);
    }
    return Array.from(names);
  }

  console.error(`  ⚠ ${placeName}: не удалось получить после повторов`);
  return [];
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL не задан в .env");
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  // Собираем список городов для импорта: город-регион (Минск),
  // областные центры (cityName) и райцентры (localities).
  type Target = { city: string; region: string; district: string };
  const targets: Target[] = [];

  for (const region of BELARUS_REGIONS) {
    if (region.cityDistricts) {
      // город (Минск и областные центры)
      targets.push({
        city: region.label,
        region: region.label,
        district: region.label,
      });
      continue;
    }
    for (const district of region.districts ?? []) {
      for (const locality of district.localities ?? []) {
        if (locality.type !== "г.") continue; // пока только города
        targets.push({
          city: locality.name,
          region: region.label,
          district: district.name,
        });
      }
    }
  }

  // Необязательный фильтр: npx tsx scripts/import-streets.ts Минск
  const filter = process.argv[2];

  for (const target of targets) {
    if (filter && target.city !== filter) continue;
    console.log(`→ ${target.region} / ${target.district} / ${target.city}`);
    const names = await fetchStreets(target.city);
    if (names.length > 0) {
      const chunk = names.map((name) => ({
        name,
        region: target.region,
        district: target.district,
        city: target.city,
      }));
      await sql`INSERT INTO radius_street ${sql(chunk, "name", "region", "district", "city")} ON CONFLICT DO NOTHING`;
      console.log(`   + ${names.length} улиц`);
    }
    // Overpass разрешает ~1-2 запроса/сек — пауза
    await new Promise((r) => setTimeout(r, 2500));
  }

  await sql.end();
  console.log("✅ Готово.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
