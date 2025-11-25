import { useState, useEffect } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";

export function useLogin() {
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

  return {
    showPassword,
    isLogin,
    isLoading,
    formData,
    togglePasswordVisibility,
    toggleMode,
    handleInputChange,
    handleSubmit,
  };
}
