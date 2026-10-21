import type { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest } from 'next/server';
import { Readable } from 'node:stream';

import { handlers } from '@/server/auth';

// Auth.js сам читает тело запроса (form-urlencoded / json),
// поэтому встроенный парсер Next отключаем.
export const config = {
    api: { bodyParser: false },
};

/**
 * Auth.js v5 отдаёт обработчики в формате Web Request/Response (под App Router),
 * а API routes Pages Router работают с Node req/res. Этот мост переводит
 * входящий запрос в NextRequest, а ответ (статус, заголовки, несколько
 * Set-Cookie) — обратно в Node-ответ.
 */
function toWebRequest(req: NextApiRequest): NextRequest {
    const proto =
        req.headers['x-forwarded-proto']?.toString().split(',')[0]?.trim() ??
        ('encrypted' in req.socket && req.socket.encrypted ? 'https' : 'http');
    const host = req.headers['x-forwarded-host'] ?? req.headers.host;
    const url = `${proto}://${host?.toString()}${req.url ?? '/'}`;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) {
            for (const v of value) {
                headers.append(key, v);
            }
        } else if (value !== undefined) {
            headers.set(key, value);
        }
    }

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';

    // `duplex: "half"` обязателен для потокового тела, но его нет в типах RequestInit.
    const init = {
        method: req.method,
        headers,
        ...(hasBody && {
            body: Readable.toWeb(req) as ReadableStream,
            duplex: 'half',
        }),
    };

    return new NextRequest(url, init as ConstructorParameters<typeof NextRequest>[1]);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        res.status(405).end();
        return;
    }

    const handle = req.method === 'GET' ? handlers.GET : handlers.POST;
    const response = await handle(toWebRequest(req));

    res.status(response.status);
    response.headers.forEach((value, key) => {
        // Set-Cookie может быть несколько — их нельзя склеивать в одну строку.
        if (key.toLowerCase() !== 'set-cookie') {
            res.setHeader(key, value);
        }
    });
    const cookies = response.headers.getSetCookie();
    if (cookies.length > 0) {
        res.setHeader('Set-Cookie', cookies);
    }

    res.send(Buffer.from(await response.arrayBuffer()));
}
