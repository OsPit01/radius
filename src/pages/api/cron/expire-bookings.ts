import type { NextApiRequest, NextApiResponse } from 'next';

import { expireStaleBookings } from '@/server/booking-expiry';

/**
 * Cron-эндпоинт для автоматической отмены просроченных заявок.
 *
 * Кто его вызывает: системный crontab на сервере (см. scripts/cron-setup.md)
 * каждые 10 минут: curl с заголовком Authorization: Bearer <CRON_SECRET>.
 *
 * Авторизация: если CRON_SECRET задан (в проде — обязателен), проверяем
 * заголовок Bearer, чтобы посторонние не могли дёргать эндпоинт и грузить БД.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const cronSecret = process.env.CRON_SECRET;

    // Если секрет задан — проверяем его. Если не задан — эндпоинт открыт
    // (небезопасно, поэтому в проде CRON_SECRET обязателен).
    if (cronSecret) {
        const authHeader = req.headers.authorization;
        if (authHeader !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    const expired = await expireStaleBookings();

    return res.status(200).json({ expired });
}
