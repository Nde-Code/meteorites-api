import { config } from "../config.ts";

const kv = await Deno.openKv();

function getTodayDate(): string { return new Date().toISOString().slice(0, 10); }

export function getIp(req: Request): string {

    return (req.headers.get("x-forwarded-for") || req.headers.get("forwarded") || "unknown");

}

export async function checkTimeRateLimit(hashedIp: string): Promise<boolean> {

    const now: number = Date.now();

    const key: string[] = ["ipTimestamps", hashedIp];

    const entry: Deno.KvEntryMaybe<number> = await kv.get<number>(key);

    if (entry.value && now - entry.value < (config.RATE_LIMIT_INTERVAL_S * 1000)) return false;

    await kv.set(key, now, { expireIn: (config.RATE_LIMIT_INTERVAL_S * 1000) });

    return true;
    
}

export async function checkDailyRateLimit(hashedIp: string): Promise<boolean> {

    const now: number = Date.now();

    const key: string[] = ["ip24hWindow", hashedIp];

    type WindowData = { startTimestamp: number; count: number };

    const entry = await kv.get<WindowData>(key);

    if (!entry.value) {

        const windowData: WindowData = { startTimestamp: now, count: 1 };

        await kv.set(key, windowData, { expireIn: (config.IPS_PURGE_TIME_DAYS * 24 * 60 * 60 * 1000) });

        return true;

    }

    if (now - entry.value.startTimestamp >= (config.IPS_PURGE_TIME_DAYS * 24 * 60 * 60 * 1000)) {

        const windowData: WindowData = { startTimestamp: now, count: 1 };

        await kv.set(key, windowData, { expireIn: (config.IPS_PURGE_TIME_DAYS * 24 * 60 * 60 * 1000) });

        return true;

    }

    if (entry.value.count >= config.MAX_READS_PER_DAY) return false;

    entry.value.count++;

    await kv.set(key, entry.value, { expireIn: (config.IPS_PURGE_TIME_DAYS * 24 * 60 * 60 * 1000) - (now - entry.value.startTimestamp) });

    return true;

}

export async function hashIp(ip: string, salt = config.HASH_KEY): Promise<string> {

    const encoder: TextEncoder = new TextEncoder();

    const data: Uint8Array<ArrayBufferLike> = encoder.encode(ip + salt);

    const hashBuffer: ArrayBuffer = await crypto.subtle.digest("SHA-256", data);
    
    return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
    
}