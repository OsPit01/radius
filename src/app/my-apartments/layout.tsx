import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function MyApartmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <>{children}</>;
}