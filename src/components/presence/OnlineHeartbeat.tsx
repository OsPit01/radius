'use client';

import { useOnlineHeartbeat } from '@/hooks/useOnlineHeartbeat';

// ============================================================
// OnlineHeartbeat — точка подключения хука присутствия.
//
// Отдельный компонент, потому что useOnlineHeartbeat внутри
// использует useSession — а он доступен только ВНУТРИ SessionProvider.
// Рендерится один раз на всё приложение, сам ничего не рисует (null).
// ============================================================
export function OnlineHeartbeat() {
    useOnlineHeartbeat();
    return null;
}
