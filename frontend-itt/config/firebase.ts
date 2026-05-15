import { initializeApp, getApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, type MessagePayload, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_CLIENT_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_CLIENT_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_CLIENT_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_CLIENT_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_CLIENT_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_CLIENT_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_CLIENT_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export const requestForToken = async () => {
  if (typeof window === 'undefined' || !messaging) return null;

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });

    await navigator.serviceWorker.ready;

    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_CLIENT_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (currentToken) {
      return currentToken;
    }
    return null;
  } catch (err) {
    console.error('Registration failed:', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload: MessagePayload) => {
      resolve(payload);
    });
  });