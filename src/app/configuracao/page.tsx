"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, TableConfig } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";

export default function ConfiguracoesPage() {
    const { user } = useAuth();
    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleAlterarSenha = async () => {
        if (!user) {
            toast.error("Usuário não autenticado");
            return;
        }

        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            toast.error("Todos os campos são obrigatórios");
            return;
        }

        if (novaSenha !== confirmarSenha) {
            toast.error("A nova senha e confirmação não coincidem");
            return;
        }

        if (novaSenha.length < 6) {
            toast.error("A nova senha deve ter pelo menos 6 caracteres");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/configuracaoApi", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: user.id,
                    senhaAtual,
                    novaSenha,
                    confirmarSenha,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Senha alterada com sucesso");
                setSenhaAtual("");
                setNovaSenha("");
                setConfirmarSenha("");
            } else {
                toast.error(data.error || "Erro ao alterar senha");
            }
        } catch (error) {
            console.error("Erro ao alterar senha:", error);
            toast.error("Erro interno do servidor");
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="flex h-screen bg-background">
            <div className="flex-1 overflow-auto">
                <header className="bg-card border-b border-border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
                            <p className="text-muted-foreground">
                                Gerencie as configurações do sistema
                            </p>
                        </div>
                    </div>
                </header>

                <main className="p-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <TableConfig className="h-5 w-5 text-primary" />
                                <CardTitle>Categorias de Despesas</CardTitle>
                            </div>
                            <CardDescription>
                                Defina as categorias de despesas da sua empresa
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-4">
                                <div className="w-1/2 gap-2 flex flex-col">
                                    <Label htmlFor="nomeCategoria">
                                        Adicione uma nova categoria
                                    </Label>
                                    <Input id="nomeCategoria" />
                                </div>
                                <Button className="w-1/4">Adicionar</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <TableConfig className="h-5 w-5 text-primary" />
                                <CardTitle>Categorias de Receitas</CardTitle>
                            </div>
                            <CardDescription>
                                Defina as categorias de receitas da sua empresa
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-4">
                                <div className="w-1/2 gap-2 flex flex-col">
                                    <Label htmlFor="nomeCategoria">
                                        Adicione uma nova categoria
                                    </Label>
                                    <Input id="nomeCategoria" />
                                </div>
                                <Button className="w-1/4">Adicionar</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <Shield className="h-5 w-5 text-primary" />
                                <CardTitle>Segurança</CardTitle>
                            </div>
                            <CardDescription>
                                Configurações de segurança e privacidade
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="senhaAtual">Senha Atual</Label>
                                <Input
                                    id="senhaAtual"
                                    type="password"
                                    placeholder="Digite sua senha atual"
                                    value={senhaAtual}
                                    onChange={(e) => setSenhaAtual(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="novaSenha">Nova Senha</Label>
                                    <Input
                                        id="novaSenha"
                                        type="password"
                                        placeholder="Digite a nova senha"
                                        value={novaSenha}
                                        onChange={(e) => setNovaSenha(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                                    <Input
                                        id="confirmarSenha"
                                        type="password"
                                        placeholder="Confirme a nova senha"
                                        value={confirmarSenha}
                                        onChange={(e) => setConfirmarSenha(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button
                                className="w-1/4"
                                onClick={handleAlterarSenha}
                                disabled={isLoading}
                            >
                                {isLoading ? "Alterando..." : "Alterar Senha"}
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}
