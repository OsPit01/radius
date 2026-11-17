// ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ

export const TIME_HHMM_REGEX = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
export const CHECK_IN_TIME_DEFAULT = '14:00';
export const CHECK_OUT_TIME_DEFAULT = '12:00';

export const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
    const time = `${String(i).padStart(2, '0')}:00`;
    return { value: time, label: time };
});

// Плоский список тех же значений (для pgEnum в схеме БД). Выводится из
// TIME_OPTIONS, а не пишется руками: один источник — значения гарантированно
// совпадают со списком в селектах форм. Тип — кортеж с минимум одним
// элементом: этого требует pgEnum (пустой enum в БД невозможен).
export const CHECK_TIME_VALUES = [...TIME_OPTIONS.map((o) => o.value)] as [string, ...string[]] satisfies [
    string,
    ...string[],
];
