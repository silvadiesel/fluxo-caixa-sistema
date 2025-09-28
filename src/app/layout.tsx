import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/hooks/useAuth";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Sistema de Fluxo de Caixa",
    description: "Controle financeiro simples e eficiente",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <body className={inter.className}>
                <AuthProvider>
                    {children}
                    <Toaster richColors position="top-right" />
                </AuthProvider>
            </body>
        </html>
    );
}
