import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "fc_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

export interface SessionUser {
    userId: number;
}

interface SessionPayload {
    uid: number;
    exp: number;
}

function getSecret(): string {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error(
            "SESSION_SECRET ausente ou muito curto (mínimo 32 caracteres). Defina no .env e no ambiente de produção."
        );
    }
    return secret;
}

function sign(value: string): string {
    return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function encode(payload: SessionPayload): string {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${body}.${sign(body)}`;
}

function decode(token: string): SessionPayload | null {
    const [body, signature] = token.split(".");
    if (!body || !signature) return null;

    const expected = Buffer.from(sign(body));
    const received = Buffer.from(signature);
    if (expected.length !== received.length) return null;
    if (!timingSafeEqual(expected, received)) return null;

    try {
        const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
        if (typeof payload.uid !== "number" || typeof payload.exp !== "number") return null;
        if (payload.exp < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}

/** Emite o cookie de sessão assinado para o usuário informado. */
export async function createSession(userId: number): Promise<void> {
    const token = encode({ uid: userId, exp: Date.now() + MAX_AGE_SECONDS * 1000 });
    const store = await cookies();

    store.set(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: MAX_AGE_SECONDS,
    });
}

export async function destroySession(): Promise<void> {
    const store = await cookies();
    store.delete(COOKIE_NAME);
}

/**
 * Identidade autenticada da requisição. É a ÚNICA fonte de verdade do usuarioId
 * nas rotas — nunca confie no usuarioId vindo da query string ou do body.
 */
export async function getSession(): Promise<SessionUser | null> {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = decode(token);
    if (!payload) return null;

    return { userId: payload.uid };
}
