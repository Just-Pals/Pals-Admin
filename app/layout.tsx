import type { Metadata } from "next";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import { SidebarProvider } from "@/components/SidebarContext";

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
    <html lang="en">
      <body className="antialiased">
        <AuthGuard>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </AuthGuard>
      </body>
    </html>
  );
}

