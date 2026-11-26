import Link from 'next/link';

import { formatShortDate } from '@/lib/date';

import { Star } from '../icons';

type SystemMessageProps = {
    text: string;
    link: string | null;
    createdAt: Date;
};

export function SystemMessage({ text, link, createdAt }: SystemMessageProps) {
    const lines = text.split('\n');
    const title = lines[0] ?? '';
    const body = lines.slice(1).join('\n');

    return (
        <div className="flex flex-col items-center">
            <span className="mb-1 text-xs text-muted-foreground"> {formatShortDate(createdAt)}</span>
            <div className="mx-auto flex w-full flex-col gap-1.5 rounded-2xl border border-border bg-card p-4 text-center">
                <Star className="size-6 text-yellow-500" />
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-sm whitespace-pre-line text-muted-foreground">{body}</p>
                {link && (
                    <Link
                        href={link}
                        className="mx-auto mt-1 w-fit rounded-[30px] border border-orange-500 px-4 py-1.5 text-xs font-medium text-orange-500 no-underline transition-colors hover:bg-orange-500/10"
                    >
                        Детали бронирования
                    </Link>
                )}
            </div>
        </div>
    );
}
