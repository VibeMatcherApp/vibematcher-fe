import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { QueryClientWrapper } from "@/components/QueryClientWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VibeMatcher",
  description: "Find your perfect match",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className={`${inter.className} overflow-x-hidden`}>
        <Providers>
          <QueryClientWrapper>
            <AuthenticatedLayout>{children}</AuthenticatedLayout>
          </QueryClientWrapper>
        </Providers>
      </body>
    </html>
  );
}
