import ProviderComponent from '@/components/layouts/provider-component';
import 'react-perfect-scrollbar/dist/css/styles.css';
import '../styles/tailwind.css';
import { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import FCMHandler from '@/components/FCMHandler';



export const viewport: Viewport = {
    themeColor: '#000000',
};

export const metadata: Metadata = {
    title: {
        template: '%s | Intern-iTT',
        default: 'Intern-iTT',
    },
    description: 'Intern-iTT Admin Dashboard',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Intern-iTT',
    },
    formatDetection: {
        telephone: false,
    },
};

const googleSans = localFont({
    src: [
        { path: '../public/fonts/GoogleSans-Regular.ttf', weight: '400', style: 'normal' },
        { path: '../public/fonts/GoogleSans-Italic.ttf', weight: '400', style: 'italic' },
        { path: '../public/fonts/GoogleSans-Medium.ttf', weight: '500', style: 'normal' },
        { path: '../public/fonts/GoogleSans-MediumItalic.ttf', weight: '500', style: 'italic' },
        { path: '../public/fonts/GoogleSans-SemiBold.ttf', weight: '600', style: 'normal' },
        { path: '../public/fonts/GoogleSans-SemiBoldItalic.ttf', weight: '600', style: 'italic' },
        { path: '../public/fonts/GoogleSans-Bold.ttf', weight: '700', style: 'normal' },
        { path: '../public/fonts/GoogleSans-BoldItalic.ttf', weight: '700', style: 'italic' },
    ],
    display: 'swap',
    variable: '--font-google-sans',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
                />
            </head>
            <body className={googleSans.variable}>
                <FCMHandler />
                <ProviderComponent>{children}</ProviderComponent>
            </body>
        </html>
    );
}
