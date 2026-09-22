import { NextResponse } from "next/server";
import { db } from "@/db/connection";
import { user } from "@/db/schema/user";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { unauthorized } from "@/lib/https";

/** Usuário da sessão atual — usado pelo front para validar o cookie no boot. */
export async function GET() {
    const session = await getSession();
    if (!session) return unauthorized();

    const [current] = await db
        .select({ id: user.id, nome: user.nome, email: user.email })
        .from(user)
        .where(eq(user.id, session.userId))
        .limit(1);

    if (!current) return unauthorized();

    return NextResponse.json({ user: current });
}
