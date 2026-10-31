// Шаблоны быстрых ответов для чата поддержки (кнопки-подсказки).
// id — для React-ключей, label — что на кнопке, text — что вставится в поле.

export type SupportTemplate = {
    id: string;
    label: string;
    text: string;
};

export const SUPPORT_TEMPLATES: SupportTemplate[] = [
    { id: 'greeting', label: 'Приветствие', text: 'Здравствуйте! чем можем помочь?' },
    {
        id: 'clarify',
        label: 'Уточнить',
        text: 'Уточните, пожалуйста, даты бронирования и номер объекта (id) - проверим информацию.',
    },
    {
        id: 'checking',
        label: 'Проверяем',
        text: 'Спасибо! Мы уже проверяем ваш вопрос, ответ будет в течение часа.',
    },
    {
        id: 'resolved',
        label: 'Решено',
        text: 'Вопрос решён. Если понадобится помощь — пишите, мы на связи!',
    },
];
