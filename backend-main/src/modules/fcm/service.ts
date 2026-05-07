import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userFcmTokens } from "@/db/schema";

export class FCMService {
  async registerToken(userId: string, token: string): Promise<void> {
    try {
      const existingToken = await db
        .select()
        .from(userFcmTokens)
        .where(
          and(eq(userFcmTokens.userId, userId), eq(userFcmTokens.token, token))
        )
        .limit(1);

      if (existingToken.length === 0) {
        await db.insert(userFcmTokens).values({
          userId,
          token,
        });
        console.log(`[FCM] New token registered for user: ${userId}`);
      } else {
        await db
          .update(userFcmTokens)
          .set({ updatedAt: new Date() })
          .where(eq(userFcmTokens.token, token));
      }
    } catch (error) {
      console.error("[FCM] registerToken error:", error);
      throw error;
    }
  }
  async getTokensByUserId(userId: string): Promise<string[]> {
    const results = await db
      .select({ token: userFcmTokens.token })
      .from(userFcmTokens)
      .where(eq(userFcmTokens.userId, userId));

    return results.map((r) => r.token);
  }

  async removeToken(token: string): Promise<void> {
    await db.delete(userFcmTokens).where(eq(userFcmTokens.token, token));
  }
}
