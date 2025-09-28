"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
    });

    useEffect(() => {
        if (isAuthenticated) {
            router.push("/");
        }
    }, [isAuthenticated, router]);

    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const toggleMode = () => setIsLogin(!isLogin);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isLogin) {
                const response = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        senha: formData.password,
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    toast.success("Login realizado com sucesso!");
                    login(data.user);
                    router.push("/");
                } else {
                    toast.error(data.error || "Erro ao fazer login");
                }
            } else {
                if (formData.password !== formData.confirmPassword) {
                    toast.error("As senhas não coincidem");
                    return;
                }

                if (formData.password.length < 6) {
                    toast.error("A senha deve ter pelo menos 6 caracteres");
                    return;
                }

                const response = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        nome: formData.name,
                        email: formData.email,
                        senha: formData.password,
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    toast.success("Conta criada com sucesso!");
                    setFormData({
                        email: "",
                        password: "",
                        confirmPassword: "",
                        name: "",
                    });
                    setIsLogin(true);
                } else {
                    toast.error(data.error || "Erro ao criar conta");
                }
            }
        } catch (error) {
            console.error("Erro:", error);
            toast.error("Erro interno. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="hidden lg:block space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-primary rounded-lg">
                                <DollarSign className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <h1 className="text-3xl font-bold text-foreground">FluxoCaixa</h1>
                        </div>
                        <p className="text-xl text-muted-foreground">
                            Controle total do seu fluxo de caixa em uma plataforma simples e
                            intuitiva
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">
                                    Gestão de Receitas
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Organize e acompanhe todas as suas entradas de forma
                                    categorizada
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-red-600 rotate-180" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">
                                    Controle de Despesas
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Monitore gastos e mantenha suas finanças sempre organizadas
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">
                                    Relatórios Detalhados
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Análises completas com DRE e indicadores de performance
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-md mx-auto">
                    <Card className="shadow-xl border-0">
                        <CardHeader className="space-y-1 text-center">
                            <div className="flex justify-center mb-4 lg:hidden">
                                <div className="p-3 bg-primary rounded-lg">
                                    <DollarSign className="h-8 w-8 text-primary-foreground" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold">
                                {isLogin ? "Bem-vindo de volta" : "Criar conta"}
                            </CardTitle>
                            <CardDescription>
                                {isLogin
                                    ? "Entre com suas credenciais para acessar sua conta"
                                    : "Crie sua conta para começar a usar o FluxoCaixa"}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {!isLogin && (
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nome completo</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            type="text"
                                            placeholder="Seu nome completo"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required={!isLogin}
                                            className="h-11"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Senha</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Sua senha"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            required
                                            className="h-11 pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-11 w-10 hover:bg-transparent"
                                            onClick={togglePasswordVisibility}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {!isLogin && (
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirmar senha</Label>
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Confirme sua senha"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            required={!isLogin}
                                            className="h-11"
                                        />
                                    </div>
                                )}

                                {isLogin && (
                                    <div className="flex justify-end">
                                        <Link
                                            href="/forgot-password"
                                            className="text-sm text-primary hover:underline"
                                        >
                                            Esqueceu sua senha?
                                        </Link>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-11 text-base"
                                    disabled={isLoading}
                                >
                                    {isLoading
                                        ? "Processando..."
                                        : isLogin
                                        ? "Entrar"
                                        : "Criar conta"}
                                </Button>
                            </form>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator className="w-full" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        ou
                                    </span>
                                </div>
                            </div>

                            <div className="text-center">
                                <span className="text-sm text-muted-foreground">
                                    {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
                                </span>{" "}
                                <Button
                                    type="button"
                                    variant="link"
                                    className="p-0 h-auto text-primary hover:underline"
                                    onClick={toggleMode}
                                >
                                    {isLogin ? "Criar conta" : "Fazer login"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-8 text-center text-xs text-muted-foreground">
                        <p>
                            Ao continuar, você concorda com nossos{" "}
                            <Link href="/terms" className="text-primary hover:underline">
                                Termos de Uso
                            </Link>{" "}
                            e{" "}
                            <Link href="/privacy" className="text-primary hover:underline">
                                Política de Privacidade
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
