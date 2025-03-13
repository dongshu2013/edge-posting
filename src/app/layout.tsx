import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/providers/WalletProvider";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import { AuthModal } from "@/components/AuthModal";
import { UserInit } from "@/components/UserInit";

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Edge Posting",
  description: "Engage with tweets and earn BUZZ tokens using AI",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geist.className} antialiased min-h-screen bg-gray-50`}
      >
        <WalletProvider>
          <div className="flex flex-col min-h-screen">
            <UserInit />
            <Navbar />
            <Toaster position="top-center" />
            <main className="flex-1 w-full">
              <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
            <AuthModal />
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
