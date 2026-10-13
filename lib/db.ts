import { Redis } from "@upstash/redis";
import { hashPassword } from "./auth";

const g: any = globalThis;
if (!g.__PAYDB__) {
  g.__PAYDB__ = { users: [], payments: [], outbox: [], __seeded: false };
}

const url = process.env.TESTING_KV_REST_API_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.TESTING_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;
const PREFIX = process.env.DB_PREFIX || "payapp";

export const usingRedis = !!redis;

async function rawGet(name: string): Promise<any[]> {
  if (redis) {
    const v: any = await redis.get(PREFIX + ":" + name);
    return v ? v : [];
  }
  return g.__PAYDB__[name] || [];
}

async function rawSet(name: string, rows: any[]) {
  if (redis) {
    await redis.set(PREFIX + ":" + name, rows);
    return;
  }
  g.__PAYDB__[name] = rows;
}

async function isSeeded() {
  if (redis) return !!(await redis.get(PREFIX + ":__seeded"));
  return g.__PAYDB__.__seeded;
}

async function markSeeded(v: boolean) {
  if (redis) {
    if (v) await redis.set(PREFIX + ":__seeded", 1);
    else await redis.del(PREFIX + ":__seeded");
    return;
  }
  g.__PAYDB__.__seeded = v;
}

function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function genId() {
  return "PAY-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function seed() {
  if (await isSeeded()) return;
  await markSeeded(true);
  const users = await rawGet("users");
  if (!users.find((u: any) => u.email == "demo@payflow.test")) {
    users.push({
      id: "u_demo",
      name: "Demo User",
      email: "demo@payflow.test",
      company: "Demo Corp",
      country: "US",
      password: hashPassword("Demo1234!"),
      verified: true,
      verifyToken: null,
      createdAt: new Date().toISOString(),
    });
    await rawSet("users", users);
  }
  const names = [
    ["John Smith", "US", "New York", "NY", "10001"],
    ["Maria Popescu", "RO", "Bucharest", "", "010011"],
    ["Hans Müller", "DE", "Berlin", "", "10115"],
    ["Claire Dubois", "FR", "Paris", "", "75001"],
    ["Emily Clarke", "GB", "London", "", "SW1A 1AA"],
    ["Liam Tremblay", "CA", "Toronto", "ON", "M5V 2T6"],
  ];
  const statuses = ["pending", "pending", "claimed", "completed", "cancelled", "pending", "claimed", "completed", "pending", "pending", "cancelled", "pending"];
  const payments: any[] = [];
  for (let i = 0; i < statuses.length; i++) {
    const n = names[i % names.length];
    const created = new Date(Date.now() - (statuses.length - i) * 86400000 * 2);
    const due = new Date(Date.now() + (i + 3) * 86400000);
    payments.push({
      id: genId(),
      ownerId: "u_demo",
      recipientName: n[0],
      recipientEmail: n[0].split(" ")[0].toLowerCase() + (i + 1) + "@mailinator.com",
      phone: i % 3 == 0 ? "+1 555 010" + i : "",
      amount: Math.round((50 + Math.random() * 2500) * 100) / 100,
      currency: ["USD", "EUR", "GBP", "RON"][i % 4],
      method: ["bank_transfer", "card", "check", "paypal"][i % 4],
      category: ["invoice", "refund", "payroll", "invoice"][i % 4],
      priority: ["normal", "low", "high", "urgent"][i % 4],
      country: n[1],
      address1: (100 + i) + " Main Street",
      address2: "",
      city: n[2],
      state: n[3],
      zip: n[4],
      dueDate: due.toISOString().slice(0, 10),
      description: "Seeded payment #" + (i + 1),
      notify: true,
      status: statuses[i],
      otp: randomOtp(),
      otpExpiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      createdAt: created.toISOString(),
      updatedAt: created.toISOString(),
      claimedAt: statuses[i] == "claimed" || statuses[i] == "completed" ? created.toISOString() : null,
      claimedBy: statuses[i] == "claimed" || statuses[i] == "completed" ? { name: n[0], iban: "GB82WEST12345698765432" } : null,
    });
  }
  const existing = await rawGet("payments");
  await rawSet("payments", existing.concat(payments));
}

export async function getTable(name: "users" | "payments" | "outbox"): Promise<any[]> {
  await seed();
  return rawGet(name);
}

export async function saveTable(name: "users" | "payments" | "outbox", rows: any[]) {
  await rawSet(name, rows);
}

export async function resetDb() {
  await rawSet("users", []);
  await rawSet("payments", []);
  await rawSet("outbox", []);
  await markSeeded(false);
}

export { randomOtp };
