import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/connection";
import { user } from "@/db/schema/user";
import { eq } from "drizzle-orm";
import CryptoJS from "crypto-js";

export async function PUT(request: NextRequest) {
    try {
        const { userId, senhaAtual, novaSenha, confirmarSenha } = await request.json();

        if (!userId || !senhaAtual || !novaSenha || !confirmarSenha) {
            return NextResponse.json(
                { error: "Todos os campos são obrigatórios" },
                { status: 400 }
            );
        }

        if (novaSenha !== confirmarSenha) {
            return NextResponse.json(
                { error: "A nova senha e confirmação não coincidem" },
                { status: 400 }
            );
        }

        if (novaSenha.length < 6) {
            return NextResponse.json(
                { error: "A nova senha deve ter pelo menos 6 caracteres" },
                { status: 400 }
            );
        }

        const existingUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);

        if (existingUser.length === 0) {
            return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
        }

        const userData = existingUser[0];

        const senhaAtualCriptografada = CryptoJS.SHA256(senhaAtual).toString();

        if (userData.senha !== senhaAtualCriptografada) {
            return NextResponse.json({ error: "Senha atual incorreta" }, { status: 401 });
        }

        const novaSenhaCriptografada = CryptoJS.SHA256(novaSenha).toString();
        if (userData.senha === novaSenhaCriptografada) {
            return NextResponse.json(
                { error: "A nova senha deve ser diferente da senha atual" },
                { status: 400 }
            );
        }

        await db
            .update(user)
            .set({
                senha: novaSenhaCriptografada,
            })
            .where(eq(user.id, userId));

        return NextResponse.json({ message: "Senha alterada com sucesso" }, { status: 200 });
    } catch (error) {
        console.error("Erro ao alterar senha:", error);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}
