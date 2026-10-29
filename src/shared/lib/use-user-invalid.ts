import { useRef, useState } from 'react';

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/**
 * Мост между визуальным `:user-invalid` и `aria-invalid`: браузер сам не выставляет aria-invalid, а читалки без него
 * либо молчат об ошибке, либо (при `:invalid`) ругаются на пустое поле ещё до того, как пользователь к нему подошёл.
 * `:user-invalid` срабатывает только после взаимодействия или попытки отправить форму — aria-invalid обновляем в те же моменты.
 *
 * В браузерах без `:user-invalid` (Chrome < 119) состояние считаем сами: «пользователь вводил в поле и ушёл с него».
 */
export function useUserInvalid() {
    const [invalid, setInvalid] = useState(false);
    const interacted = useRef(false);

    const sync = (control: Control) => {
        const native = CSS.supports('selector(:user-invalid)');
        setInvalid(native ? control.matches(':user-invalid') : interacted.current && !control.checkValidity());
    };

    return {
        invalid,
        /** Ушли с поля — показываем ошибку. */
        onBlur: sync,
        /** Печатаем: ошибку убираем сразу, как только значение стало корректным (новую до ухода с поля не показываем). */
        onInput: (control: Control) => {
            interacted.current = true;
            if (invalid) {
                sync(control);
            }
        },
        /** Попытка отправить форму с неверным значением. */
        onInvalid: (control: Control) => {
            interacted.current = true;
            sync(control);
        },
    };
}
