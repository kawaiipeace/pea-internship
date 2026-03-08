import ProviderComponent from '@/components/layouts/provider-component';
import 'react-perfect-scrollbar/dist/css/styles.css';
import '../styles/tailwind.css';
import { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';

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

const nunito = Nunito({
    weight: ['400', '500', '600', '700', '800'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-nunito',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={nunito.variable}>
                <ProviderComponent>{children}</ProviderComponent>
            </body>
        </html>
    );
}
