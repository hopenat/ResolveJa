import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-9e4cc32d/health", (c) => {
  return c.json({ status: "ok" });
});

const P = "/make-server-9e4cc32d";

app.get(`${P}/state`, async (c) => {
  const users = await kv.getByPrefix("user:");
  const requests = await kv.getByPrefix("req:");
  return c.json({ users, requests });
});

app.put(`${P}/users/:id`, async (c) => {
  const u = await c.req.json();
  await kv.set(`user:${c.req.param("id")}`, u);
  return c.json({ ok: true });
});

app.put(`${P}/requests/:id`, async (c) => {
  const r = await c.req.json();
  await kv.set(`req:${c.req.param("id")}`, r);
  return c.json({ ok: true });
});

app.post(`${P}/reset`, async (c) => {
  const { users, requests } = await c.req.json();
  const old = [...(await kv.getByPrefix("user:")), ...(await kv.getByPrefix("req:"))];
  if (old.length) await kv.mdel([...(await kv.getByPrefix("user:")).map((u: any) => `user:${u.id}`), ...(await kv.getByPrefix("req:")).map((r: any) => `req:${r.id}`)]);
  await kv.mset(users.map((u: any) => `user:${u.id}`), users);
  await kv.mset(requests.map((r: any) => `req:${r.id}`), requests);
  return c.json({ ok: true });
});

Deno.serve(app.fetch);