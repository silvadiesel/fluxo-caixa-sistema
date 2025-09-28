import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";

export function badRequest(message: string, issues?: unknown) {
    return NextResponse.json({ error: message, issues }, { status: 400 });
}
export function notFound() {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
}
export function ok<T>(data: T, init?: ResponseInit) {
    return NextResponse.json({ data }, init);
}

export function parseId(raw: string): number | null {
    const id = Number.parseInt(raw, 10);
    return Number.isFinite(id) && id > 0 ? id : null;
}

export async function readJson<T>(
    req: NextRequest,
    schema: ZodSchema<T>
): Promise<{ data?: T; error?: Response }> {
    try {
        const body = await req.json();
        const parsed = schema.safeParse(body);
        if (!parsed.success)
            return { error: badRequest("Dados incorretos, verifique", parsed.error.format()) };
        return { data: parsed.data };
    } catch {
        return { error: badRequest("Body must be valid JSON") };
    }
}

export function readQuery<T>(
    req: NextRequest,
    schema: ZodSchema<T>
): { data?: T; error?: Response } {
    const parsed = schema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
    if (!parsed.success)
        return { error: badRequest("Dados incorretos, verifique", parsed.error.format()) };
    return { data: parsed.data };
}
