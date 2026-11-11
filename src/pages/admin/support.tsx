import { useEffect, useRef, useState } from 'react';

import { useSession } from 'next-auth/react';

import { SupportChat } from '@/components/admin/support/SupportChat';
import { TicketCard } from '@/components/admin/support/TicketCard';
import { TransferModal } from '@/components/admin/support/TransferModal';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { hasPermission, isAdminRole } from '@/lib/constants/roles';
import { requireAuth } from '@/server/auth/require-auth';
import { api } from '@/trpc/react';

// Неавторизованных разворачивает на вход ещё на сервере.
export const getServerSideProps = requireAuth;

export default function SupportPage() {
    // ===== Данные =====
    const { data: session } = useSession();
    const myId = session?.user?.id ?? '';

    // ===== Очередь заявок с пагинацией (бесконечная лента) =====
    // Сервер отдаёт по 50 штук за страницу; следующая догружается при прокрутке
    // до низа (sentinel ниже). refetchInterval обновляет первую страницу —
    // новые заявки всплывают наверх без перегрузки всей очереди.
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = api.support.listAll.useInfiniteQuery(
        { limit: 50 },
        {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
            refetchInterval: 5000,
        },
    );
    // Все загруженные страницы — в один плоский список.
    const tickets = data?.pages.flatMap((page) => page.items) ?? [];

    // Выбранная заявка: null — показываем список, число — открыта переписка.
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // Чей id раскрыт полностью (глаз в карточке заявки): null — все свёрнуты.
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // Сообщения ВЫБРАННОЙ заявки. enabled: пока чат не открыт — запрос не уходит.
    const { data: messages } = api.support.messages.useQuery(
        { id: selectedId ?? 0 },
        { enabled: selectedId !== null, refetchInterval: 5000 },
    );

    // ===== Ответ админа =====
    const utils = api.useUtils();
    const [text, setText] = useState('');
    const sendMessage = api.support.send.useMutation({
        onSuccess: () => void utils.support.messages.invalidate(),
    });
    const markRead = api.support.markRead.useMutation({ onSuccess: () => void utils.support.listAll.invalidate() });
    const takeTicket = api.support.assign.useMutation({ onSuccess: () => void utils.support.listAll.invalidate() });
    const leaveTicket = api.support.leave.useMutation({ onSuccess: () => void utils.support.listAll.invalidate() });
    const closeTicket = api.support.close.useMutation({ onSuccess: () => void utils.support.listAll.invalidate() });
    // Удаление заявки целиком (superadmin/mainadmin): после удаления
    // возвращаемся к списку — открытую переписку смотреть больше нечего.
    const deleteTicket = api.support.delete.useMutation({
        onSuccess: () => {
            setSelectedId(null);
            void utils.support.listAll.invalidate();
        },
    });

    // ===== Передача заявки другому админу =====
    const [transferOpen, setTransferOpen] = useState(false);
    const [transferTo, setTransferTo] = useState('');
    const { data: admins } = api.support.admins.useQuery(undefined, { enabled: selectedId !== null });
    const transfer = api.support.transfer.useMutation({
        onSuccess: () => {
            setTransferOpen(false);
            setTransferTo('');
            void utils.support.listAll.invalidate();
        },
    });

    // ===== Догрузка при скролле =====
    // Sentinel внизу списка: как только он появляется на экране (за 200px до
    // конца — грузим заранее), запрашиваем следующую страницу.
    // Один источник правды — hasNextPage с сервера.
    const loadMoreRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = loadMoreRef.current;
        if (!el) {
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    void fetchNextPage();
                }
            },
            { rootMargin: '200px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Отправить ответ: guard'ы — пустой текст, «чат не открыт» и «уже отправляем».
    const handleSend = async () => {
        if (!text.trim() || selectedId === null || sendMessage.isPending) {
            return;
        }
        await sendMessage.mutateAsync({ id: selectedId, text: text.trim() });
        setText('');
    };

    // Не админ — заглушка (проверка ПОСЛЕ всех хуков).
    if (!isAdminRole(session?.user?.role)) {
        return (
            <AuthGuard>
                <ClientHeader />
                <div>Нет доступа</div>
            </AuthGuard>
        );
    }

    // Данные выбранной заявки (для «Ведёт: Имя» и кнопок взять/выйти).
    const selected = tickets.find((t) => t.id === selectedId) ?? null;

    return (
        <AuthGuard>
            <ClientHeader />
            <div className="mx-auto max-w-[1200px] px-4 py-10">
                {/* ТЕРНАРНИК: список ↔ окно переписки. Один источник правды — selectedId. */}
                {selectedId === null ? (
                    <>
                        <h1 className="pb-2 text-[25px] max-md:text-xl">Обращения в поддержку</h1>
                        <p className="pb-6 text-sm text-muted-foreground">Заявки пользователей: переписка и ответы.</p>

                        {/* 4 колонки на десктопе (компактные карточки), меньше на
                            планшете, 1 колонка на телефоне — карточка не разъезжается. */}
                        <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
                            {tickets.map((item) => (
                                <TicketCard
                                    key={item.id}
                                    item={item}
                                    expanded={expandedId === item.id}
                                    onToggleId={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                    onOpen={() => {
                                        setSelectedId(item.id);
                                        markRead.mutate({ id: item.id });
                                    }}
                                />
                            ))}
                        </div>
                        {tickets.length === 0 && (
                            <p className="py-10 text-center text-muted-foreground">Заявок пока нет</p>
                        )}
                        {/* Sentinel: оказался на экране — догружаем следующую страницу. */}
                        {hasNextPage && (
                            <div
                                ref={loadMoreRef}
                                className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"
                            >
                                {isFetchingNextPage && (
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
                                )}
                                {isFetchingNextPage ? 'Загружаем…' : 'Прокрутите вниз, чтобы загрузить ещё'}
                            </div>
                        )}
                    </>
                ) : (
                    <SupportChat
                        selectedId={selectedId}
                        selected={selected}
                        myId={myId}
                        messages={messages}
                        text={text}
                        onChangeText={setText}
                        onBack={() => setSelectedId(null)}
                        onTake={() => takeTicket.mutate({ id: selectedId })}
                        onLeave={() => leaveTicket.mutate({ id: selectedId })}
                        onSend={handleSend}
                        onOpenTransfer={() => setTransferOpen(true)}
                        onClose={() => closeTicket.mutate({ id: selectedId })}
                        canDelete={hasPermission(session?.user?.role ?? '', 'superadmin')}
                        onDelete={() => deleteTicket.mutate({ id: selectedId })}
                    />
                )}

                <TransferModal
                    open={transferOpen}
                    onClose={() => setTransferOpen(false)}
                    admins={admins}
                    myId={myId}
                    transferTo={transferTo}
                    onChangeTransferTo={setTransferTo}
                    onTransfer={() => {
                        if (selectedId !== null) {
                            transfer.mutate({ id: selectedId, adminId: transferTo });
                        }
                    }}
                    isPending={transfer.isPending}
                />
            </div>
        </AuthGuard>
    );
}
