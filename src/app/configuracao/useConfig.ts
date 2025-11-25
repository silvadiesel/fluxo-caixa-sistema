import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";

export function useConfig() {
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

  return {
    senhaAtual,
    setSenhaAtual,
    novaSenha,
    setNovaSenha,
    confirmarSenha,
    setConfirmarSenha,
    isLoading,
    handleAlterarSenha,
  };
}
