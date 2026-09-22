import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/**
 * Formato do hash novo: `scrypt$<saltHex>$<hashHex>`.
 * O formato legado é um SHA-256 puro (64 caracteres hex, sem separador).
 */
export async function hashPassword(senha: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH).toString("hex");
    const derived = (await scrypt(senha, salt, KEY_LENGTH)) as Buffer;
    return `scrypt$${salt}$${derived.toString("hex")}`;
}

function isLegacyHash(stored: string): boolean {
    return /^[a-f0-9]{64}$/i.test(stored);
}

/** O hash guardado ainda está no formato antigo e deve ser regravado após um login válido. */
export function needsRehash(stored: string): boolean {
    return isLegacyHash(stored);
}

export async function verifyPassword(senha: string, stored: string): Promise<boolean> {
    if (isLegacyHash(stored)) {
        const legacy = createHash("sha256").update(senha).digest("hex");
        return safeEqualHex(legacy, stored);
    }

    const [algo, salt, hash] = stored.split("$");
    if (algo !== "scrypt" || !salt || !hash) return false;

    const derived = (await scrypt(senha, salt, KEY_LENGTH)) as Buffer;
    return safeEqualHex(derived.toString("hex"), hash);
}

function safeEqualHex(a: string, b: string): boolean {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
}
