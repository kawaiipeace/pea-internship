'use client';
import React, { useState } from 'react';
import IconBell from '@/components/icon/icon-bell';
import IconHome from '@/components/icon/icon-home';
import IconUser from '@/components/icon/icon-user';
import IconSettings from '@/components/icon/icon-settings';
import IconStar from '@/components/icon/icon-star';
import IconHeart from '@/components/icon/icon-heart';
import IconShoppingCart from '@/components/icon/icon-shopping-cart';
import IconBarChart from '@/components/icon/icon-bar-chart';
import AnimateHeight from 'react-animate-height';

const TestPage = () => {
    const [activeTab, setActiveTab] = useState(1);
    const [accordionOpen, setAccordionOpen] = useState<number | null>(1);

    return (
        <div className="p-6">
            {/* Page Header */}
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-dark dark:text-white-dark">
                    Vristo Components Test
                </h1>
                <div className="flex gap-2">
                    <button className="btn btn-primary">
                        <IconBell className="mr-2 h-4 w-4" />
                        Notifications
                    </button>
                    <button className="btn btn-outline-primary">Settings</button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <div className="panel">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-lg font-bold text-primary">1,245</div>
                            <div className="text-sm text-white-dark">Total Users</div>
                        </div>
                        <div className="rounded-full bg-primary-light p-3 dark:bg-primary-dark-light">
                            <IconUser className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                </div>
                <div className="panel">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-lg font-bold text-success">856</div>
                            <div className="text-sm text-white-dark">Total Orders</div>
                        </div>
                        <div className="rounded-full bg-success-light p-3 dark:bg-success-dark-light">
                            <IconShoppingCart className="h-6 w-6 text-success" />
                        </div>
                    </div>
                </div>
                <div className="panel">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-lg font-bold text-warning">$45,200</div>
                            <div className="text-sm text-white-dark">Revenue</div>
                        </div>
                        <div className="rounded-full bg-warning-light p-3 dark:bg-warning-dark-light">
                            <IconBarChart className="h-6 w-6 text-warning" />
                        </div>
                    </div>
                </div>
                <div className="panel">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-lg font-bold text-danger">4.8⭐</div>
                            <div className="text-sm text-white-dark">Avg Rating</div>
                        </div>
                        <div className="rounded-full bg-danger-light p-3 dark:bg-danger-dark-light">
                            <IconStar className="h-6 w-6 text-danger" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Buttons Section */}
            <div className="panel mb-6">
                <h2 className="mb-4 text-lg font-semibold">Buttons</h2>
                <div className="flex flex-wrap gap-3">
                    <button className="btn btn-primary">Primary</button>
                    <button className="btn btn-secondary">Secondary</button>
                    <button className="btn btn-success">Success</button>
                    <button className="btn btn-danger">Danger</button>
                    <button className="btn btn-warning">Warning</button>
                    <button className="btn btn-info">Info</button>
                    <button className="btn btn-dark">Dark</button>
                    <button className="btn btn-gradient">Gradient</button>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                    <button className="btn btn-outline-primary">Outline Primary</button>
                    <button className="btn btn-outline-secondary">Outline Secondary</button>
                    <button className="btn btn-outline-success">Outline Success</button>
                    <button className="btn btn-outline-danger">Outline Danger</button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Tabs */}
                <div className="panel">
                    <h2 className="mb-4 text-lg font-semibold">Tabs</h2>
                    <div className="mb-4 flex gap-2 border-b border-white-light dark:border-[#191e3a]">
                        {[
                            { id: 1, label: 'Home', icon: <IconHome className="h-4 w-4" /> },
                            { id: 2, label: 'Profile', icon: <IconUser className="h-4 w-4" /> },
                            { id: 3, label: 'Settings', icon: <IconSettings className="h-4 w-4" /> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 border-b-2 px-4 py-2 transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-white-dark hover:text-primary'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="pt-2">
                        {activeTab === 1 && (
                            <p className="text-sm text-white-dark">
                                Welcome to the <strong className="text-primary">Home</strong> tab! This is a Vristo tabs component
                                with custom icons and animations.
                            </p>
                        )}
                        {activeTab === 2 && (
                            <p className="text-sm text-white-dark">
                                This is the <strong className="text-success">Profile</strong> tab content. You can display user
                                information here.
                            </p>
                        )}
                        {activeTab === 3 && (
                            <p className="text-sm text-white-dark">
                                This is the <strong className="text-warning">Settings</strong> tab content. Configure your
                                preferences here.
                            </p>
                        )}
                    </div>
                </div>

                {/* Accordion */}
                <div className="panel">
                    <h2 className="mb-4 text-lg font-semibold">Accordion</h2>
                    <div className="space-y-2">
                        {[
                            { id: 1, title: 'What is Vristo?', content: 'Vristo is a premium admin dashboard template built with Next.js and Tailwind CSS, providing beautiful UI components for building modern web applications.' },
                            { id: 2, title: 'How to customize?', content: 'You can customize the theme colors, fonts, and layout through the theme.config.tsx file and tailwind.config.js. The Redux store manages dark mode, RTL, and other settings.' },
                            { id: 3, title: 'Is it responsive?', content: 'Yes! All components are fully responsive and work perfectly on mobile, tablet, and desktop devices.' },
                        ].map((item) => (
                            <div key={item.id} className="overflow-hidden rounded-md border border-white-light dark:border-[#191e3a]">
                                <button
                                    onClick={() => setAccordionOpen(accordionOpen === item.id ? null : item.id)}
                                    className={`flex w-full items-center justify-between px-4 py-3 text-left font-semibold ${
                                        accordionOpen === item.id ? 'bg-primary text-white' : 'bg-white dark:bg-black'
                                    }`}
                                >
                                    {item.title}
                                    <svg
                                        className={`h-4 w-4 transition-transform ${accordionOpen === item.id ? 'rotate-180' : ''}`}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </button>
                                <AnimateHeight duration={300} height={accordionOpen === item.id ? 'auto' : 0}>
                                    <div className="bg-white px-4 py-3 text-sm text-white-dark dark:bg-black">
                                        {item.content}
                                    </div>
                                </AnimateHeight>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Badges & Icons */}
            <div className="panel mt-6">
                <h2 className="mb-4 text-lg font-semibold">Badges</h2>
                <div className="flex flex-wrap gap-3">
                    <span className="badge bg-primary">Primary</span>
                    <span className="badge bg-secondary">Secondary</span>
                    <span className="badge bg-success">Success</span>
                    <span className="badge bg-danger">Danger</span>
                    <span className="badge bg-warning">Warning</span>
                    <span className="badge bg-info">Info</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                    <span className="badge badge-outline-primary">Outline Primary</span>
                    <span className="badge badge-outline-secondary">Outline Secondary</span>
                    <span className="badge badge-outline-success">Outline Success</span>
                    <span className="badge badge-outline-danger">Outline Danger</span>
                </div>
            </div>

            {/* Forms */}
            <div className="panel mt-6">
                <h2 className="mb-4 text-lg font-semibold">Form Elements</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label>Name</label>
                        <input type="text" className="form-input" placeholder="Enter your name" />
                    </div>
                    <div>
                        <label>Email</label>
                        <input type="email" className="form-input" placeholder="Enter your email" />
                    </div>
                    <div>
                        <label>Select Option</label>
                        <select className="form-select">
                            <option>Choose...</option>
                            <option>Option 1</option>
                            <option>Option 2</option>
                            <option>Option 3</option>
                        </select>
                    </div>
                    <div>
                        <label>Password</label>
                        <input type="password" className="form-input" placeholder="Enter password" />
                    </div>
                    <div className="md:col-span-2">
                        <label>Message</label>
                        <textarea className="form-textarea" rows={3} placeholder="Type your message..."></textarea>
                    </div>
                </div>
                <div className="mt-4 flex gap-3">
                    <button className="btn btn-primary">
                        <IconHeart className="mr-2 h-4 w-4" />
                        Submit
                    </button>
                    <button className="btn btn-outline-danger">Cancel</button>
                </div>
            </div>

            {/* Table */}
            <div className="panel mt-6">
                <h2 className="mb-4 text-lg font-semibold">Simple Table</h2>
                <div className="table-responsive">
                    <table className="table-hover">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { id: 1, name: 'สมชาย ดีมาก', email: 'somchai@email.com', role: 'Admin', status: 'Active' },
                                { id: 2, name: 'สมหญิง รักดี', email: 'somying@email.com', role: 'Editor', status: 'Active' },
                                { id: 3, name: 'วิชัย สร้างสรรค์', email: 'wichai@email.com', role: 'Viewer', status: 'Inactive' },
                                { id: 4, name: 'มานี ใจดี', email: 'manee@email.com', role: 'Admin', status: 'Active' },
                            ].map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td className="font-semibold">{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`badge ${
                                            user.role === 'Admin' ? 'bg-primary' : user.role === 'Editor' ? 'bg-secondary' : 'bg-dark'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TestPage;
