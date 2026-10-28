type AddressParts = {
    city?: string | null;
    street?: string | null;
    numberHome?: string | null;
    /** Корпус отдельной строкой — только у старых объектов: в новых он входит в номер дома. */
    building?: string | null;
};

/**
 * Адрес одной строкой: «Минск, улица Немига, д. 5», «Минск, улица Притыцкого, д. 156к1».
 * Показываем в форме и записываем в базу при создании объекта (на него смотрят чаты и переписка).
 */
export function formatAddressLine({ city, street, numberHome, building }: AddressParts): string {
    let line = city?.trim() ?? '';
    if (street?.trim()) {
        line += `, ${street.trim()}`;
    }
    if (numberHome?.trim()) {
        line += `, д. ${numberHome.trim()}`;
    }
    if (building?.trim()) {
        line += `/${building.trim()}`;
    }
    return line;
}

/**
 * Номер дома в виде, пригодном для сравнения: «156к1», «156/1» и «156 корп. 1» — один и тот же дом.
 */
export function normalizeHouse(value: string): string {
    return value
        .toLowerCase()
        .replaceAll('ё', 'е')
        .replace(/[\s.]+/g, '')
        .replace(/корпус|корп/g, 'к')
        .replaceAll('/', 'к');
}
