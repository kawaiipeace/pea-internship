import admin from "firebase-admin";
import { db } from "@/db";
import { userFcmTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

interface FirebaseError extends Error {
  code?: string;
}

interface NotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: Bun.env.FIREBASE_PROJECT_ID,
      clientEmail: Bun.env.FIREBASE_CLIENT_EMAIL,
      privateKey: Bun.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const messaging: admin.messaging.Messaging = admin.messaging();

export const sendNotification = async ({
  token,
  title,
  body,
  data,
}: NotificationPayload): Promise<string | null> => {
  const message: admin.messaging.Message = {
    notification: {
      title,
      body,
    },
    data: data || {},
    token: token,
    android: {
      priority: "high",
      notification: {
        sound: "default",
        channelId: "default_channel",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
        },
      },
    },
    webpush: {
      notification: {
        icon: "/favicon.ico",
        badge: "/pwa-icon.svg",
      },
    },
  };

  try {
    const response: string = await messaging.send(message);
    return response;
  } catch (error: unknown) { 
    const fcmError = error as FirebaseError; 

    if (
      fcmError.code === 'messaging/registration-token-not-registered' ||
      fcmError.code === 'messaging/invalid-registration-token'
    ) {
      console.warn(`[FCM] Token is no longer valid. Deleting from DB: ${token}`);
      await db.delete(userFcmTokens).where(eq(userFcmTokens.token, token));
    }

    console.error("FCM Error:", fcmError.message);
    return null;
  }
}

export const sendMulticastNotification = async (
  tokens: string[],
  title: string,
  body: string
): Promise<admin.messaging.BatchResponse | null> => {
  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: { title, body },
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    return response;
  } catch (error: unknown) {
    console.error("Multicast Error:", error instanceof Error ? error.message : error);
    return null;
  }
};