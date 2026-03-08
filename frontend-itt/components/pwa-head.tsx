/**
 * PWA Head Component
 * Adds necessary meta tags for Progressive Web App functionality
 */
export const PWAHead = () => {
    return (
        <>
            {/* PWA Meta Tags */}
            <meta name="theme-color" content="#009688" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="apple-mobile-web-app-title" content="Vristo" />

            {/* Preconnect and DNS Prefetch */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

            {/* Manifest and Icons */}
            <link rel="manifest" href="/manifest.json" />
            <link rel="icon" type="image/svg+xml" href="/pwa-icons/icon-192x192.svg" />
            <link rel="apple-touch-icon" href="/pwa-icons/icon-192x192.svg" />

            {/* Viewport and other mobile settings */}
            <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
            <meta name="description" content="A modern admin dashboard application built with Next.js, React 19, and TypeScript" />

            {/* Splash screen for iOS */}
            <link rel="apple-touch-startup-image" href="/pwa-icons/icon-512x512.svg" />
        </>
    );
};
