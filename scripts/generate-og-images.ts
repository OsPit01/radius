// Скрипт сборки картинок превью ссылки (Open Graph) для страниц без своего фото.
//
// Берёт логотип (тёмный — из корня public, светлый — из public/light) и кладёт его по центру холста 1200×630
// (формат «большой карточки» в Telegram, WhatsApp, Facebook) на фон своей темы —
// получаются public/og/default-light.png и public/og/default-dark.png.
// Исходные иконки непрозрачные (белый / чёрный фон), поэтому со сплошным фоном холста они сливаются без шва.
//
// Запуск: npm run og:generate   (нужен только после смены логотипа — результат лежит в git)

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

import { OG_IMAGE_SIZE, type OgTheme, SITE_OG_IMAGES } from '../src/lib/seo';

// Иконки — 512×512; чуть увеличиваем, чтобы логотип занимал почти всю высоту холста.
const ICON_SIZE = 560;

const THEMES: Record<OgTheme, { background: string; icon: string }> = {
    light: { background: '#ffffff', icon: 'public/light/icon-512x512.png' },
    dark: { background: '#000000', icon: 'public/web-app-manifest-512x512.png' },
};

async function main() {
    await mkdir(path.join('public', 'og'), { recursive: true });

    for (const theme of Object.keys(THEMES) as OgTheme[]) {
        const { background, icon } = THEMES[theme];
        const output = path.join('public', SITE_OG_IMAGES[theme]);

        const logo = await sharp(icon).resize(ICON_SIZE, ICON_SIZE).toBuffer();

        const info = await sharp({
            create: { ...OG_IMAGE_SIZE, channels: 3, background },
        })
            .composite([{ input: logo, gravity: 'center' }])
            .png({ compressionLevel: 9 })
            .toFile(output);

        console.log(`${output}: ${info.width}×${info.height}, ${(info.size / 1024).toFixed(0)} KB`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
