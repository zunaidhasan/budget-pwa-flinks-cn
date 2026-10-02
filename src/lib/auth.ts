import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { seedDatabase } from "@/db/seed";

export const SESSION_COOKIE_NAME = "can_budget_session_user";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionEmail) {
      const found = await db.select().from(users).where(eq(users.email, sessionEmail)).limit(1);
      if (found.length > 0) {
        return found[0];
      }
    }

    // Default to the seeded Canadian demo user if exists, or auto-seed
    const defaultUser = await db.select().from(users).where(eq(users.email, "alex.tremblay@example.ca")).limit(1);
    if (defaultUser.length > 0) {
      return defaultUser[0];
    }

    // Auto seed if empty
    await seedDatabase();
    const seededUser = await db.select().from(users).where(eq(users.email, "alex.tremblay@example.ca")).limit(1);
    return seededUser[0] || null;
  } catch (e) {
    console.error("Error retrieving user session:", e);
    return null;
  }
}
