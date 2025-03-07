import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/providers/WalletProvider";
import { Navbar } from "@/components/Navbar";

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BUZZ",
  description: "Engage with tweets and earn credits using AI",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} antialiased flex flex-col min-h-screen bg-gradient-to-b from-indigo-50 to-white`}>
        <WalletProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
