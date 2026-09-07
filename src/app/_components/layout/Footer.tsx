import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-[#eaeaea] bg-white py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 text-sm text-[#666] md:flex-row">
        <span className="text-center md:text-left">
          © {new Date().getFullYear()} radius-stay.by — аренда жилья посуточно
        </span>
        <a
          href="https://express-pay.by"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Платёжный сервис «Экспресс Платежи»"
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors hover:border-[#d8d8d8] hover:bg-[#f0f0f0]"
        >
          <Image
            src="https://express-pay.by/brandbook/logo.png"
            alt="Экспресс Платежи"
            title="Экспресс Платежи"
            width={72}
            height={28}
            className="h-auto w-auto"
            priority={false}
          />
          <span className="text-[11px] whitespace-nowrap text-[#999] transition-colors group-hover:text-[#666]">
            онлайн-оплата
          </span>
        </a>
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1">
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
