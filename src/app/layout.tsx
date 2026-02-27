import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
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
      <head>
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="/js/decryption-client.js"
          strategy="beforeInteractive"
        />
      </head>
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
