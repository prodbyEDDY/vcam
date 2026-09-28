import { env } from 'cloudflare:workers';
import { signaling } from '@/lib/signaling.mjs';
const handle = (request: Request) => signaling(request, (env as unknown as { DB: D1Database }).DB);
export const GET = handle;
export const POST = handle;
export const DELETE = handle;
