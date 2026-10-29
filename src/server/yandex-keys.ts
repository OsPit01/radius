import { TRPCError } from '@trpc/server';

const REQUEST_TIMEOUT_MS = 5000;

/**
 * Сколько не трогаем ключ после отказа. Без паузы каждый запрос сначала бил бы в исчерпанный основной ключ
 * и только потом шёл в резервный. Лимит обычно суточный, поэтому раз в 10 минут основной проверяем снова.
 */
const KEY_COOLDOWN_MS = 10 * 60 * 1000;

/**
 * Статусы, при которых имеет смысл взять другой ключ: 429 — исчерпан лимит, 403 — ключ не принят
 * (неверный, отключён, ограничен). Остальные ошибки (5xx и т.п.) резервный ключ не вылечит.
 */
const isKeyRejected = (status: number) => status === 429 || status === 403;

type KeyRotationOptions = {
    /** Для логов: «геокодер», «геосаджест». */
    name: string;
    /** Ключи по порядку: основной, затем резервный. Пустые отбрасываются. */
    getKeys: () => Array<string | undefined>;
};

/**
 * Запросы к API Яндекса с резервным ключом: идём основным, а когда он отказал (лимит исчерпан или ключ не принят) —
 * резервным. У каждого продукта Яндекса (геокодер, геосаджест) свои ключи и свои квоты, поэтому у каждого свой экземпляр.
 * Ключи берутся из env на сервере и в браузер не попадают.
 */
export function createKeyRotation({ name, getKeys }: KeyRotationOptions) {
    // Когда ключу можно пробовать снова (индекс = позиция в списке ключей). Живёт в памяти одного экземпляра сервера:
    // на Vercel у каждого экземпляра своя «память», это нормально — в худшем случае он один раз зря постучится в основной ключ.
    const blockedUntil: number[] = [];
    const unavailable = () => new TRPCError({ code: 'BAD_GATEWAY', message: 'Поиск адреса временно недоступен' });

    /** `buildUrl` получает ключ и возвращает полный адрес запроса. Возвращает успешный ответ или бросает TRPCError. */
    return async function fetchWithKeys(buildUrl: (apiKey: string) => URL): Promise<Response> {
        const apiKeys = getKeys().filter((key): key is string => Boolean(key));

        if (apiKeys.length === 0) {
            throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Поиск адреса не настроен' });
        }

        // Ключи, которые недавно отказали, пропускаем. Если отказали все — всё равно пробуем по кругу:
        // лимит мог сброситься, а отклонённый запрос квоту не тратит.
        const now = Date.now();
        const order = apiKeys.map((key, index) => ({ key, index }));
        const ready = order.filter(({ index }) => (blockedUntil[index] ?? 0) <= now);
        const candidates = ready.length > 0 ? ready : order;

        let res: Response | undefined;
        for (const { key, index } of candidates) {
            try {
                res = await fetch(buildUrl(key), { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
            } catch (err) {
                // Сеть/таймаут — другим ключом это не лечится, и ждать ещё 5 секунд второй раз незачем.
                console.error(`[yandex-${name}] запрос не удался:`, err instanceof Error ? err.name : err);
                throw unavailable();
            }

            if (res.ok || !isKeyRejected(res.status)) {
                break;
            }

            // Ключ и URL в лог не пишем — только какой по счёту ключ и статус.
            blockedUntil[index] = now + KEY_COOLDOWN_MS;
            console.error(
                `[yandex-${name}] ${index === 0 ? 'основной' : 'резервный'} ключ отклонён (HTTP ${res.status})` +
                    (index < apiKeys.length - 1 ? ', пробую следующий' : ''),
            );
        }

        if (!res?.ok) {
            console.error(`[yandex-${name}] HTTP`, res?.status);
            throw unavailable();
        }
        return res;
    };
}
