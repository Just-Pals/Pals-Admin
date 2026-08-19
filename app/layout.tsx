import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import { SidebarProvider } from "@/components/SidebarContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PALS Admin Panel",
  description: "Admin panel for PALS application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-background text-white">
        <AuthGuard>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </AuthGuard>
      </body>
    </html>
  );
}
