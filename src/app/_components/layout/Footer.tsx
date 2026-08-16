import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#eaeaea] bg-white py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-sm text-[#666] sm:flex-row">
        <span>© {new Date().getFullYear()} radius-stay.by — аренда жилья посуточно</span>
        <nav className="flex gap-5">
          <Link href="/privacy" className="hover:text-[#222]">
            Политика конфиденциальности
          </Link>
          <Link href="/terms" className="hover:text-[#222]">
            Условия использования
          </Link>
        </nav>
      </div>
    </footer>
  );
}
