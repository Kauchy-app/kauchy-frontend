"use client";
import React from 'react';
import Navbar from './Navbar';
import LeftNav from './LeftNav';
import { usePathname } from 'next/navigation';

export default function PageLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isNoNavPage = pathname === '/signup' || pathname === '/signup' || pathname === '/waitlist' || pathname.startsWith('/feed');

    if (isNoNavPage) {
        return <>{children}</>;
    }

    const isChatPage = pathname === '/chat';
    const isOrdersPage = pathname.startsWith('/orders');
    const isHomeFeed = pathname === '/';
    const isSearchPage = pathname === '/search';

    // The home feed is fixed-height and non-scrolling. On mobile it lives between
    // the top + bottom nav bars (dvh so it never slips under the fixed bottom nav);
    // on desktop those bars are replaced by the left sidebar, so it goes full-height
    // and is offset by the collapsed rail width (72px).
    //
    // On desktop the rail is the only nav (top + bottom bars are hidden), so content
    // goes full-height and is offset by the 72px rail. On mobile the top + bottom bars
    // are present, so content sits between them.
    const mainClass = isHomeFeed
        ? 'w-full overflow-hidden mt-[70px] mb-[65px] h-[calc(100dvh-135px)] md:mt-0 md:mb-0 md:h-[100dvh] md:pl-[72px]'
        : isChatPage
        ? 'mb-[65px] md:mb-0 w-full overflow-hidden h-[calc(100dvh-65px)] md:h-[100dvh] md:pl-[72px]'
        : isSearchPage
        ? 'mb-[65px] md:mb-0 w-full min-h-[calc(100dvh-65px)] md:min-h-screen md:pl-[72px] flex flex-col'
        : isOrdersPage
        ? 'mt-[70px] mb-[65px] md:mt-0 md:mb-0 w-full overflow-hidden h-[calc(100dvh-135px)] md:h-[100dvh] md:pl-[72px]'
        : 'mt-[70px] mb-[65px] md:mt-0 md:mb-0 w-full min-h-[calc(100vh-135px)] md:min-h-screen md:pl-[72px] flex flex-col';

    return (
        <>
            <Navbar />
            <LeftNav />
            <main className={mainClass}>
                {children}
            </main>
        </>
    );
}
