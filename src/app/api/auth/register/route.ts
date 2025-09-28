import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/connection";
import { user } from "@/db/schema/user";
import { eq } from "drizzle-orm";
import CryptoJS from "crypto-js";

export async function POST(request: NextRequest) {
    try {
        const { nome, email, senha } = await request.json();

        if (!nome || !email || !senha) {
            return NextResponse.json(
                { error: "Nome, email e senha são obrigatórios" },
                { status: 400 }
            );
        }

        const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);

        if (existingUser.length > 0) {
            return NextResponse.json({ error: "Email já está em uso" }, { status: 409 });
        }

        const senhaCriptografada = CryptoJS.SHA256(senha).toString();

        const newUser = await db
            .insert(user)
            .values({
                nome,
                email,
                senha: senhaCriptografada,
            })
            .returning();

        return NextResponse.json(
            {
                message: "Usuário criado com sucesso",
                user: {
                    id: newUser[0].id,
                    nome: newUser[0].nome,
                    email: newUser[0].email,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Erro ao criar usuário:", error);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}
