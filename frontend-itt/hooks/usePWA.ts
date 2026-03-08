import { useEffect, useState } from 'react';

/**
 * Custom hook for PWA install prompt handling
 * Detects when the app can be installed and provides functions to install it
 */
export const usePWAInstall = () => {
    const [isInstallPromptVisible, setIsInstallPromptVisible] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallPromptVisible(true);
        };

        // Listen for successful app installation
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallPromptVisible(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) return;

        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setIsInstalled(true);
            }

            setIsInstallPromptVisible(false);
            setDeferredPrompt(null);
        } catch (error) {
            console.error('Error installing app:', error);
        }
    };

    const dismissPrompt = () => {
        setIsInstallPromptVisible(false);
    };

    return {
        isInstallPromptVisible,
        isInstalled,
        installApp,
        dismissPrompt,
        deferredPrompt: !!deferredPrompt,
    };
};

/**
 * Custom hook to check the status of service worker
 * Useful for showing update notifications to users
 */
export const useServiceWorker = () => {
    const [swActive, setSwActive] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(() => {
                setSwActive(true);
            });

            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                setUpdateAvailable(true);
            });
        }
    }, []);

    const refreshApp = () => {
        window.location.reload();
    };

    return {
        swActive,
        updateAvailable,
        refreshApp,
    };
};
