"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/hooks/useAuth";
import { Menu, Home, TrendingUp, TrendingDown, Calendar, LogOut } from "lucide-react";

export function MobileMenu() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();

    const menuItems = [
        { href: "/", label: "Dashboard", icon: Home },
        { href: "/receita", label: "Receitas", icon: TrendingUp },
        { href: "/despesa", label: "Despesas", icon: TrendingDown },
        { href: "/calendario", label: "Calendário", icon: Calendar },
    ];

    const handleLogout = () => {
        logout();
        setOpen(false);
        router.push("/login");
    };

    return (
        <>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button
                        size="icon"
                        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50 md:hidden"
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>

                <SheetContent side="left" className="w-[280px] p-0">
                    <SheetHeader className="p-6 border-b border-border">
                        <SheetTitle className="text-xl font-bold text-primary">
                            FluxoCaixa
                        </SheetTitle>
                    </SheetHeader>

                    <nav className="flex-1 p-4">
                        <div className="space-y-2">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                    >
                                        <Button
                                            variant={isActive ? "default" : "ghost"}
                                            className={`w-full justify-start ${
                                                isActive
                                                    ? "bg-primary text-primary-foreground"
                                                    : "text-foreground hover:bg-muted"
                                            }`}
                                        >
                                            <Icon className="h-5 w-5 mr-3" />
                                            <span>{item.label}</span>
                                        </Button>
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>

                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
                        <div className="flex items-center space-x-3 mb-3">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                    {user?.nome?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {user?.nome || "Usuário"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {user?.email || "usuario@email.com"}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sair
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
