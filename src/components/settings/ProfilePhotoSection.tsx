import Image from 'next/image';

import { User } from '@/components/icons';
import { Modal } from '@/components/ui/Modal';

type ProfilePhotoSectionProps = {
    /** Текущее фото профиля ('' — фото нет). */
    image: string;
    /** Открыта ли модалка «поменять фото». */
    modalOpen: boolean;
    onOpenModal: () => void;
    onCloseModal: () => void;
    /** Скрытый input выбора файла — его кликает модалка. */
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    /** Пользователь выбрал файл. */
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function ProfilePhotoSection({
    image,
    modalOpen,
    onOpenModal,
    onCloseModal,
    fileInputRef,
    onFileChange,
}: ProfilePhotoSectionProps) {
    return (
        <>
            <button
                type="button"
                onClick={onOpenModal}
                className="absolute top-10 right-10 cursor-pointer rounded-full transition-opacity hover:opacity-80"
                aria-label="Изменить фото профиля"
            >
                {image === '' ? (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                ) : (
                    <Image
                        src={image}
                        alt="avatar"
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-full object-cover"
                    />
                )}
            </button>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
            />

            <Modal
                open={modalOpen}
                onClose={onCloseModal}
            >
                <div className="text-center">
                    <p className="text-lg text-foreground">Хотите поменять фотографию профиля?</p>
                    <div className="mt-6 flex justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="cursor-pointer rounded-[30px] bg-primary px-6 py-2.5 text-base font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                            Выбрать фото
                        </button>
                        <button
                            type="button"
                            onClick={onCloseModal}
                            className="cursor-pointer rounded-[30px] border border-border px-6 py-2.5 text-base font-semibold text-foreground hover:bg-muted"
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
