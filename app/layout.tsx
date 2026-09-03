import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Acopio Hub",
  description:
    "Sistema de registro y coordinación de centros de acopio para campañas de ayuda.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={inter.variable}>
      <body className="min-h-full">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
