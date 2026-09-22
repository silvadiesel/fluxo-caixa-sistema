import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/connection";
import { user } from "@/db/schema/user";
import { eq } from "drizzle-orm";
import { hashPassword, needsRehash, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
    try {
        const { email, senha } = await request.json();

        if (!email || !senha) {
            return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 });
        }

        const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);

        if (existingUser.length === 0) {
            return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
        }

        const userData = existingUser[0];

        const senhaCorreta = await verifyPassword(senha, userData.senha);

        if (!senhaCorreta) {
            return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
        }

        // Migração transparente: senha ainda no formato SHA-256 antigo é regravada
        // com scrypt + salt agora que sabemos que ela confere.
        if (needsRehash(userData.senha)) {
            await db
                .update(user)
                .set({ senha: await hashPassword(senha) })
                .where(eq(user.id, userData.id));
        }

        await createSession(userData.id);

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
