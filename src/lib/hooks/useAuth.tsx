"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface User {
    id: number;
    nome: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // A sessão real é o cookie httpOnly; o localStorage guarda apenas o
        // perfil para a UI não piscar. Quem manda é a resposta de /api/auth/me.
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
                setIsAuthenticated(true);
            } catch {
                localStorage.removeItem("user");
            }
        }

        let ativo = true;

        (async () => {
            try {
                const response = await fetch("/api/auth/me");

                if (!ativo) return;

                if (response.ok) {
                    const { user: sessionUser } = await response.json();
                    setUser(sessionUser);
                    setIsAuthenticated(true);
                    localStorage.setItem("user", JSON.stringify(sessionUser));
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                    localStorage.removeItem("user");
                    localStorage.removeItem("isAuthenticated");
                }
            } catch {
                // Falha de rede: mantém o estado otimista do localStorage.
            } finally {
                if (ativo) setIsLoading(false);
            }
        })();

        return () => {
            ativo = false;
        };
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("user");
        localStorage.removeItem("isAuthenticated");
        void fetch("/api/auth/logout", { method: "POST" });
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }
    return context;
}
