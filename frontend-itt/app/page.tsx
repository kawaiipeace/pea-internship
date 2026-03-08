'use client';
import React from 'react';
import Link from 'next/link';

export default function Home() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#fafafa] font-nunito dark:bg-[#060818]">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-primary mb-4">Intern-iTT</h1>
                <p className="text-lg text-white-dark mb-8">Welcome to Intern-iTT Dashboard</p>
                <Link href="/student" className="btn btn-primary">
                    Go to Student Dashboard
                </Link>
            </div>
        </div>
    );
}
