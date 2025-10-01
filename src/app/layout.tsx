"use client";

import { Inter } from "next/font/google";
import type React from "react";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { Sidebar } from "@/components/sidebar";
import { MobileMenu } from "@/components/menuMobile";
import { usePathname } from "next/navigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen bg-background">
            <div className="hidden md:block">
                <Sidebar />
            </div>

            <div className="md:hidden">
                <MobileMenu />
            </div>

            <div className="flex-1 overflow-auto">{children}</div>
        </div>
    );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        document.title = "FluxoCaixa";
    }, []);

    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <head>
                <meta name="description" content="Controle financeiro simples e eficiente" />
            </head>
            <body className={inter.className}>
                <AuthProvider>
                    <LayoutContent>{children}</LayoutContent>
                    <Toaster richColors position="top-right" />
                </AuthProvider>
            </body>
        </html>
    );
}
