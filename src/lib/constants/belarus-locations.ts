// Справочник населённых пунктов Беларуси.
// Иерархия: Город/Область -> Район -> Населённый пункт.
// Статические данные — храним локально, без API.

export type LocalityType = "г." | "д." | "п." | "аг." | "г.п.";

export type Locality = {
  name: string;
  type: LocalityType;
};

export type District = {
  name: string; // "Минский район"
  localities: Locality[];
};

export type Region = {
  value: string;
  label: string; // "Минск" или "Минская область"
  cityDistricts?: string[]; // районы города (для областных центров и Минска)
  districts?: District[]; // административные районы (для области)
};

export function localityLabel(locality: Locality): string {
  return `${locality.type} ${locality.name}`;
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФАБРИКИ =====
function city(name: string): Locality {
  return { name, type: "г." };
}

function town(name: string): Locality {
  return { name, type: "г.п." };
}

function village(name: string): Locality {
  return { name, type: "д." };
}

function settlement(name: string): Locality {
  return { name, type: "п." };
}

function agro(name: string): Locality {
  return { name, type: "аг." };
}

// Район с одним городом-райцентром (совпадающим по названию с районом).
function district(cityName: string): District {
  return { name: `${cityName} район`, localities: [city(cityName)] };
}

// ===== СПРАВОЧНИК =====
export const BELARUS_REGIONS: Region[] = [
  {
    value: "minsk",
    label: "Минск",
    cityDistricts: [
      "Центральный",
      "Советский",
      "Первомайский",
      "Партизанский",
      "Заводской",
      "Ленинский",
      "Октябрьский",
      "Московский",
      "Фрунзенский",
    ],
  },
  {
    value: "minsk-region",
    label: "Минская область",
    districts: [
      {
        name: "Минский район",
        localities: [
          village("Копище"),
          agro("Боровляны"),
          agro("Лесной"),
          agro("Озерцо"),
          agro("Сеница"),
          agro("Ждановичи"),
          agro("Колодищи"),
          agro("Михановичи"),
          agro("Ратомка"),
          agro("Острошицкий Городок"),
          village("Прилуки"),
          village("Тарасово"),
          village("Зацень"),
          village("Сёмково"),
          village("Валерьяново"),
          village("Атолино"),
          village("Юхновка"),
          settlement("Большевик"),
          village("Дроздово"),
          village("Заречье"),
        ],
      },
      district("Березино"),
      district("Борисов"),
      district("Вилейка"),
      district("Воложин"),
      district("Дзержинск"),
      district("Клецк"),
      district("Копыль"),
      district("Крупки"),
      district("Логойск"),
      district("Любань"),
      district("Молодечно"),
      district("Мядель"),
      district("Несвиж"),
      { name: "Пуховичский район", localities: [city("Марьина Горка")] },
      district("Слуцк"),
      district("Смолевичи"),
      district("Солигорск"),
      district("Старые Дороги"),
      district("Столбцы"),
      district("Узда"),
      district("Червень"),
    ],
  },
  {
    value: "brest",
    label: "Брест",
    cityDistricts: ["Ленинский", "Московский"],
  },
  {
    value: "brest-region",
    label: "Брестская область",
    districts: [
      district("Барановичи"),
      district("Берёза"),
      district("Ганцевичи"),
      district("Дрогичин"),
      district("Жабинка"),
      district("Иваново"),
      district("Ивацевичи"),
      district("Каменец"),
      district("Кобрин"),
      district("Лунинец"),
      district("Ляховичи"),
      district("Малорита"),
      district("Пинск"),
      district("Пружаны"),
      district("Столин"),
    ],
  },
  {
    value: "vitebsk",
    label: "Витебск",
    cityDistricts: ["Железнодорожный", "Октябрьский", "Первомайский"],
  },
  {
    value: "vitebsk-region",
    label: "Витебская область",
    districts: [
      district("Бешенковичи"),
      district("Браслав"),
      district("Верхнедвинск"),
      district("Глубокое"),
      district("Городок"),
      district("Докшицы"),
      district("Дубровно"),
      district("Лепель"),
      district("Лиозно"),
      district("Миоры"),
      district("Орша"),
      district("Полоцк"),
      district("Поставы"),
      district("Россоны"),
      district("Сенно"),
      district("Толочин"),
      district("Ушачи"),
      district("Чашники"),
      district("Шарковщина"),
      district("Шумилино"),
    ],
  },
  {
    value: "gomel",
    label: "Гомель",
    cityDistricts: [
      "Железнодорожный",
      "Новобелицкий",
      "Советский",
      "Центральный",
    ],
  },
  {
    value: "gomel-region",
    label: "Гомельская область",
    districts: [
      district("Брагин"),
      district("Буда-Кошелёво"),
      district("Ветка"),
      district("Добруш"),
      district("Ельск"),
      district("Житковичи"),
      district("Жлобин"),
      district("Калинковичи"),
      district("Корма"),
      district("Лельчицы"),
      district("Лоев"),
      district("Мозырь"),
      district("Наровля"),
      district("Октябрьский"),
      district("Петриков"),
      district("Речица"),
      district("Рогачёв"),
      district("Светлогорск"),
      district("Хойники"),
      district("Чечерск"),
    ],
  },
  {
    value: "grodno",
    label: "Гродно",
    cityDistricts: ["Ленинский", "Октябрьский"],
  },
  {
    value: "grodno-region",
    label: "Гродненская область",
    districts: [
      { name: "Берестовицкий район", localities: [town("Большая Берестовица")] },
      district("Волковыск"),
      district("Вороново"),
      district("Дятлово"),
      district("Зельва"),
      district("Ивье"),
      district("Кореличи"),
      district("Лида"),
      district("Мосты"),
      district("Новогрудок"),
      district("Островец"),
      district("Ошмяны"),
      district("Свислочь"),
      district("Слоним"),
      district("Сморгонь"),
      district("Щучин"),
    ],
  },
  {
    value: "mogilev",
    label: "Могилёв",
    cityDistricts: ["Ленинский", "Октябрьский"],
  },
  {
    value: "mogilev-region",
    label: "Могилёвская область",
    districts: [
      district("Белыничи"),
      district("Бобруйск"),
      district("Быхов"),
      district("Глуск"),
      district("Горки"),
      district("Дрибин"),
      district("Кировск"),
      district("Климовичи"),
      district("Кличев"),
      district("Костюковичи"),
      district("Краснополье"),
      district("Кричев"),
      district("Круглое"),
      district("Мстиславль"),
      district("Осиповичи"),
      district("Славгород"),
      district("Хотимск"),
      district("Чаусы"),
      district("Чериков"),
      district("Шклов"),
    ],
  },
];

export function getRegion(regionValue: string): Region | undefined {
  return BELARUS_REGIONS.find((r) => r.value === regionValue);
}
