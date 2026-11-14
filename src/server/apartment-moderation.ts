import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type { ApartmentStatus } from '@/lib/constants/apartment-status';
import { buildStatusNotificationText } from '@/lib/constants/apartment-status';
import type * as schema from '@/server/db/schemas';
import { users } from '@/server/db/schemas';
import { notifyUser } from '@/server/notify';

type Database = PostgresJsDatabase<typeof schema>;

/**
 * После смены статуса объекта: уведомить владельца и, при одобрении (active),
 * повысить его роль до lessor — он теперь арендодатель.
 * Одна точка для этой логики — вместо копирования в каждый вызов.
 */
export async function notifyOwnerAboutStatusChange(
    db: Database,
    apartment: { id: number; title: string; createdById: string | null },
    status: ApartmentStatus,
    rejectionReason?: string,
): Promise<void> {
    if (!apartment.createdById) {
        return;
    }

    // notifyUser = единая точка: колокольчик в БД + дублирование в Telegram
    // владельцу, если он его подключил (см. src/server/notify.ts)
    await notifyUser(db, {
        userId: apartment.createdById, // кому — владелец
        type: `status_${status}`, // тип — что случилось
        title: `Ваш объект «${apartment.title}»`, // субъект в заголовке
        text: buildStatusNotificationText(status, rejectionReason), // действие в тексте
        apartmentId: apartment.id, // о каком объекте
        link: `/apartments/${apartment.id}`, // куда ведёт уведомление
    });

    // Одобрили — владелец стал арендодателем (роль lessor). Только если он
    // ещё обычный пользователь (user): повторное одобрение роль не трогает.
    if (status === 'active') {
        await db
            .update(users)
            .set({ role: 'lessor' })
            .where(and(eq(users.id, apartment.createdById), eq(users.role, 'user')));
    }
}
