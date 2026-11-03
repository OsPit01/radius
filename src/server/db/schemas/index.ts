// Единая точка входа в схему БД: сами таблицы лежат по одному файлу рядом.
// drizzle-kit (db:push) читает ТОЛЬКО экспорты этого файла, а drizzle(conn, { schema }) строит по ним
// db.query — таблица, не ре-экспортированная здесь, для них «пропадёт» (db:push попытается её удалить).
// Новая таблица = новый файл в этой папке + одна строка ниже.
export * from '../relations';
export * from './account';
export * from './apartment';
export * from './apartment-view';
export * from './booking';
export * from './conversation';
export * from './favorite';
export * from './message';
export * from './notification';
export * from './rate-limit';
export * from './session';
export * from './site-visit';
export * from './support-message';
export * from './support-ticket';
export * from './user';
export * from './verification-token';
