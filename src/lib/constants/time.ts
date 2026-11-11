// ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ

export const TIME_HHMM_REGEX = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
export const CHECK_IN_TIME_DEFAULT = '14:00';
export const CHECK_OUT_TIME_DEFAULT = '12:00';

export const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
    const time = `${String(i).padStart(2, '0')}:00`;
    return { value: time, label: time };
});
