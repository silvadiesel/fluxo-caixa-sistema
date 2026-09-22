import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/connection";
import { user } from "@/db/schema/user";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/guard";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export async function PUT(request: NextRequest) {
    try {
        // O usuário alterado é sempre o da sessão; o userId do body é ignorado.
        const { userId, error: authError } = await requireUser();
        if (authError) return authError;

        const { senhaAtual, novaSenha, confirmarSenha } = await request.json();

        if (!senhaAtual || !novaSenha || !confirmarSenha) {
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

        if (!(await verifyPassword(senhaAtual, userData.senha))) {
            return NextResponse.json({ error: "Senha atual incorreta" }, { status: 401 });
        }

        if (await verifyPassword(novaSenha, userData.senha)) {
            return NextResponse.json(
                { error: "A nova senha deve ser diferente da senha atual" },
                { status: 400 }
            );
        }

        await db
            .update(user)
            .set({ senha: await hashPassword(novaSenha) })
            .where(eq(user.id, userId));

        return NextResponse.json({ message: "Senha alterada com sucesso" }, { status: 200 });
    } catch (error) {
        console.error("Erro ao alterar senha:", error);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}
