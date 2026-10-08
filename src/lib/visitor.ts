// Уникальный идентификатор браузера посетителя.
// Хранится в localStorage: пока браузер не очистит хранилище, id остаётся
// тем же, поэтому повторные заходы и обновления страницы не считаются
// новым уникальным переходом.
const STORAGE_KEY = "radius_visitor_id";

export function getOrCreateVisitorId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
