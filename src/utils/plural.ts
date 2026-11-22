const russianPluralRules = new Intl.PluralRules('ru');

export const plural = (count: number, one: string, few: string, many: string, other: string = few): string => {
    if (!Number.isInteger(count)) {
        return other;
    }

    switch (russianPluralRules.select(count)) {
        case 'one':
            return one;
        case 'few':
            return few;
        case 'many':
            return many;
        default:
            return other;
    }
};
