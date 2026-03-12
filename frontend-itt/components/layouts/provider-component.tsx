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
import { appWithI18Next } from 'ni18n';
import { ni18nConfig } from 'ni18n.config.ts';
import Loading from '@/components/layouts/loading';
import { MantineProvider } from '@mantine/core';

interface IProps {
    children?: ReactNode;
}

const ProviderComponent = ({ children }: IProps) => {
    return (
        <MantineProvider>
            <Provider store={store}>
                <Suspense fallback={<Loading />}>
                    <App>{children} </App>
                </Suspense>
            </Provider>
        </MantineProvider>
    );
};

export default ProviderComponent;
// todo
// export default appWithI18Next(ProviderComponent, ni18nConfig);
