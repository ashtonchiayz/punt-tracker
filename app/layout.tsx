import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Punt Tracker | Shared Expenses & Debt Simplification",
  description: "Track shared group expenses, real-time net balances, pairwise debt matrix, and automated settlement plans for Sidd, Chia, Yh, and Cy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-black text-zinc-100 font-sans selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
