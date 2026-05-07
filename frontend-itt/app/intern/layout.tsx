'use client';
import ContentAnimation from '@/components/layouts/content-animation';
import Header from '@/components/layouts/header-intern';
import MainContainer from '@/components/layouts/main-container';
import Overlay from '@/components/layouts/overlay';
import Setting from '@/components/layouts/setting';
import Sidebar from '@/components/layouts/sidebar-intern';
import Portals from '@/components/portals';
import useAuthStore from '@/store/authStore';
import SetProfile from '@/components/setProfile';
import { useMemo } from 'react';

import InternshipLockModal from '@/components/InternshipLockModal';

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore();
    const profile = user?.profile && !Array.isArray(user.profile) ? user.profile : null;

    const isLocked = useMemo(() => {
        if (!user || !profile) return false;

        // Ensure roleId is checked correctly regardless of type (string/number)
        if (Number(user.roleId) !== 3) return false;

        const status = profile.internshipStatus?.toUpperCase();

        // Block all statuses that are not yet 'ACTIVE' or 'COMPLETE'
        // This covers IDLE, PENDING, INTERVIEW, REVIEW, ACCEPT, AWAITING
        const activeStatuses = ['ACTIVE', 'EXTENDED', 'COMPLETE'];
        const isNotYetActive = status && !activeStatuses.includes(status);

        if (isNotYetActive) {
            // Lock if they are in a waiting state
            // The message inside the modal will handle the date display
            return true;
        }

        return false;
    }, [user, profile]);

    return (
        <>
            {isLocked && (
                <InternshipLockModal startDate={profile?.startDate} />
            )}
            {user && (!user.profile || (!Array.isArray(user.profile) && !user.profile.image)) && (
                <SetProfile />
            )}
            {/* BEGIN MAIN CONTAINER */}
            <div className="relative">
                <Overlay />
                {/* <ScrollToTop /> */}

                {/* BEGIN APP SETTING LAUNCHER */}
                <Setting />
                {/* END APP SETTING LAUNCHER */}

                <MainContainer>
                    {/* BEGIN SIDEBAR */}
                    <Sidebar />
                    {/* END SIDEBAR */}
                    <div className="main-content flex min-h-screen flex-col">
                        {/* BEGIN TOP NAVBAR */}
                        <Header />
                        {/* END TOP NAVBAR */}

                        {/* BEGIN CONTENT AREA */}
                        <ContentAnimation>{children}</ContentAnimation>
                        {/* END CONTENT AREA */}

                        {/* BEGIN FOOTER */}
                        {/* <Footer /> */}
                        {/* END FOOTER */}
                        <Portals />
                    </div>
                </MainContainer>
            </div>
        </>
    );
}
