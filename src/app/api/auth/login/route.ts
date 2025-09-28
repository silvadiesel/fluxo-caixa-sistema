import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/connection";
import { user } from "@/db/schema/user";
import { eq } from "drizzle-orm";
import CryptoJS from "crypto-js";

export async function POST(request: NextRequest) {
    try {
        const { email, senha } = await request.json();

        if (!email || !senha) {
            return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 });
        }

        // Buscar usuário pelo email
        const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);

        if (existingUser.length === 0) {
            return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
        }

        const userData = existingUser[0];

        // Criptografar a senha fornecida para comparar
        const senhaCriptografada = CryptoJS.SHA256(senha).toString();

        // Verificar se a senha está correta
        if (userData.senha !== senhaCriptografada) {
            return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
        }

        // Login bem-sucedido - retornar dados do usuário (sem a senha)
        return NextResponse.json(
            {
                message: "Login realizado com sucesso",
                user: {
                    id: userData.id,
                    nome: userData.nome,
                    email: userData.email,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}
