'use client';

import React, { useState } from 'react';
import { usePWAInstall, useServiceWorker } from '@/hooks/usePWA';

/**
 * PWA Install Button Component
 * Shows install prompt when available and displays update notifications
 */
export const PWAInstallButton = () => {
    const { isInstallPromptVisible, isInstalled, installApp, dismissPrompt } = usePWAInstall();
    const { updateAvailable, refreshApp } = useServiceWorker();
    const [showUpdateNotification, setShowUpdateNotification] = useState(false);

    React.useEffect(() => {
        if (updateAvailable) {
            setShowUpdateNotification(true);
        }
    }, [updateAvailable]);

    // Don't show anything if app is already installed
    if (isInstalled && !updateAvailable) {
        return null;
    }

    // Show update notification if available
    if (showUpdateNotification) {
        return (
            <div className="fixed bottom-4 right-4 max-w-sm rounded-lg bg-blue-50 p-4 shadow-lg dark:bg-blue-900/20">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">Update Available</h3>
                        <p className="mt-1 text-sm text-blue-700 dark:text-blue-200">A new version is available. Refresh to update.</p>
                    </div>
                    <button
                        onClick={() => setShowUpdateNotification(false)}
                        className="text-blue-900 hover:text-blue-700 dark:text-blue-100 dark:hover:text-blue-300"
                    >
                        ✕
                    </button>
                </div>
                <div className="mt-3 flex gap-2">
                    <button
                        onClick={refreshApp}
                        className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowUpdateNotification(false)}
                        className="rounded bg-blue-100 px-3 py-1 text-sm font-medium text-blue-900 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700"
                    >
                        Later
                    </button>
                </div>
            </div>
        );
    }

    // Show install prompt if available
    if (isInstallPromptVisible) {
        return (
            <div className="fixed bottom-4 right-4 max-w-sm rounded-lg bg-green-50 p-4 shadow-lg dark:bg-green-900/20">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-semibold text-green-900 dark:text-green-100">Install App</h3>
                        <p className="mt-1 text-sm text-green-700 dark:text-green-200">
                            Install Vristo on your device for quick access and offline support.
                        </p>
                    </div>
                    <button
                        onClick={dismissPrompt}
                        className="text-green-900 hover:text-green-700 dark:text-green-100 dark:hover:text-green-300"
                    >
                        ✕
                    </button>
                </div>
                <div className="mt-3 flex gap-2">
                    <button
                        onClick={installApp}
                        className="rounded bg-green-600 px-4 py-1 text-sm font-medium text-white hover:bg-green-700"
                    >
                        Install
                    </button>
                    <button
                        onClick={dismissPrompt}
                        className="rounded bg-green-100 px-4 py-1 text-sm font-medium text-green-900 hover:bg-green-200 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700"
                    >
                        Not Now
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default PWAInstallButton;
