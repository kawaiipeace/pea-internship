'use client';
import { IRootState } from '@/store';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const RoleGuard = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    const router = useRouter();
    const adminRole = useSelector((state: IRootState) => state.themeConfig.adminRole);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            // Logic to prevent cross-role access
            if (adminRole === 'admin') {
                // Admin role should not access mentor-specific paths
                if (pathname.startsWith('/admin/mentor')) {
                    router.push('/admin');
                    return false;
                }
            } else if (adminRole === 'mentor') {
                // Mentor role should should be redirected to mentor dashboard if hitting the admin root
                if (pathname === '/admin' || pathname === '/admin/') {
                    router.push('/admin/mentor/approve');
                    return false;
                }
                
                // Optional: prevent accessing other potential admin-only non-mentor paths
                // For now, focusing on the specific paths mentioned by the user
            }
            return true;
        };

        const authorized = checkAuth();
        setIsAuthorized(authorized);
    }, [pathname, adminRole, router]);

    // Show a loading/spinner during the redirect phase to prevent flickering of unauthorized content
    if (!isAuthorized) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-[#9A0D8A]"></div>
            </div>
        );
    }

    return <>{children}</>;
};

export default RoleGuard;
