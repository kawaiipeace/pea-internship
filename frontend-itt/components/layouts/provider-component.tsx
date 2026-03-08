'use client';

// Suppress React 19 Tippy ref warning at module level (before any components render)
if (typeof window !== 'undefined') {
    const originalError = console.error;
    console.error = (...args: any[]) => {
        const message = args[0]?.toString?.() || String(args[0]);
        if (message.includes('Accessing element.ref was removed in React 19')) {
            return;
        }
        originalError(...args);
    };
}

import App from '@/App';
import store from '@/store';
import { Provider } from 'react-redux';
import React, { ReactNode, Suspense } from 'react';
import Loading from '@/components/layouts/loading';

interface IProps {
    children?: ReactNode;
}

const ProviderComponent = ({ children }: IProps) => {
    return (
        <Provider store={store}>
            <Suspense fallback={<Loading />}>
                <App>{children}</App>
            </Suspense>
        </Provider>
    );
};

export default ProviderComponent;

