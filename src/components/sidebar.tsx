import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  Calendar,
  Home,
  Menu,
  TrendingDown,
  TrendingUp,
  X,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

export const Sidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };
  return (
    <div
      className={`${
        sidebarOpen ? "w-64" : "w-16"
      } h-full transition-all duration-300 bg-sidebar border-r border-sidebar-border flex flex-col`}
    >
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {sidebarOpen && (
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Flow Cash
            </h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {sidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <nav className="flex-1 p-2">
        <div className="space-y-2">
          <Button
            asChild
            variant="ghost"
            className={`w-full hover:bg-sidebar-accent ${
              sidebarOpen ? "justify-start" : "justify-center"
            } ${pathname === "/" ? "bg-sidebar-accent" : ""}`}
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              {sidebarOpen && <span className="ml-2">Dashboard</span>}
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className={`w-full hover:bg-sidebar-accent ${
              sidebarOpen ? "justify-start" : "justify-center"
            } ${pathname === "/receita" ? "bg-sidebar-accent" : ""}`}
          >
            <Link href="/receita">
              <TrendingUp className="h-4 w-4" />
              {sidebarOpen && <span className="ml-2">Receitas</span>}
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className={`w-full hover:bg-sidebar-accent ${
              sidebarOpen ? "justify-start" : "justify-center"
            } ${pathname === "/despesa" ? "bg-sidebar-accent" : ""}`}
          >
            <Link href="/despesa">
              <TrendingDown className="h-4 w-4" />
              {sidebarOpen && <span className="ml-2">Despesas</span>}
            </Link>
          </Button>
          {/* <Button
            asChild
            variant="ghost"
            className={`w-full hover:bg-sidebar-accent ${
              sidebarOpen ? "justify-start" : "justify-center"
            } ${pathname === "/relatorio" ? "bg-sidebar-accent" : ""}`}
          >
            <Link href="/relatorio">
              <BarChart3 className="h-4 w-4" />
              {sidebarOpen && <span className="ml-2">Relatórios</span>}
            </Link>
          </Button> */}
          <Button
            asChild
            variant="ghost"
            className={`w-full hover:bg-sidebar-accent ${
              sidebarOpen ? "justify-start" : "justify-center"
            } ${pathname === "/calendario" ? "bg-sidebar-accent" : ""}`}
          >
            <Link href="/calendario">
              <Calendar className="h-4 w-4" />
              {sidebarOpen && <span className="ml-2">Calendário</span>}
            </Link>
          </Button>
        </div>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.nome?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex flex-col items-start min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.nome || "Usuário"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || "usuario@email.com"}
                </p>
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
