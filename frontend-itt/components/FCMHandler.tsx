'use client';

import { useEffect } from 'react';
import { requestForToken } from '@/config/firebase';
import { onMessage } from 'firebase/messaging';
import { messaging } from '@/config/firebase';
import axios from '@/api/axios';

export default function FCMHandler() {
    useEffect(() => {
        const setupFCM = async () => {
            const token = await requestForToken();
            if (token) {
                try {
                    await axios.post('/fcm/notifications/register-token', { token });
                } catch (error) {
                    console.error('Error registering FCM token:', error);
                }
            }
        };

        setupFCM();

        if (messaging) {
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Message received: ', payload);

                if (Notification.permission === 'granted') {
                    new Notification(payload.notification?.title || 'แจ้งเตือนใหม่', {
                        body: payload.notification?.body,
                        icon: '/favicon.ico',
                    });
                }
            });

            return () => unsubscribe();
        }
    }, []);

    return null;
}