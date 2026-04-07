'use client';
import ContentAnimation from '@/components/layouts/content-animation';
import Header from '@/components/layouts/header';
import MainContainer from '@/components/layouts/main-container';
import Overlay from '@/components/layouts/overlay';
import Setting from '@/components/layouts/setting';
import Sidebar from '@/components/layouts/sidebar-intern';
import Portals from '@/components/portals';
import useAuthStore from '@/store/authStore';
import SetProfile from '@/components/setProfile';

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore();

    return (
        <>
            {user && !user?.profile?.image && (
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
