import { createClient } from "@libsql/client";

const URL = process.env.TURSO_DATABASE_URL;
const AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!URL || !AUTH_TOKEN) {
    throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
}

export const db = createClient({ url: URL, authToken: AUTH_TOKEN });
