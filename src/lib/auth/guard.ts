import { unauthorized } from "@/lib/https";
import { getSession } from "./session";

/**
 * Exige uma sessão válida na rota. Devolve o userId autenticado ou a resposta 401
 * pronta para retornar. Use o userId daqui no lugar de qualquer usuarioId recebido
 * do cliente.
 */
export async function requireUser(): Promise<
    { userId: number; error?: never } | { userId?: never; error: Response }
> {
    const session = await getSession();
    if (!session) return { error: unauthorized() };
    return { userId: session.userId };
}
