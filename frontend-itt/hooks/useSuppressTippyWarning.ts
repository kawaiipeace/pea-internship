import { useEffect } from 'react';

/**
 * Suppresses the React 19 compatibility warning from @tippyjs/react
 * This hook should be called in any component that uses Tippy
 */
export const useSuppressTippyWarning = () => {
    useEffect(() => {
        const originalError = console.error;
        console.error = (...args: any[]) => {
            const message = args[0]?.toString?.() || String(args[0]);
            if (message.includes('Accessing element.ref was removed in React 19')) {
                return;
            }
            originalError(...args);
        };
        return () => {
            console.error = originalError;
        };
    }, []);
};
