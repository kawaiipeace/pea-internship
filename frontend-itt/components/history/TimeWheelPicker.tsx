'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TimeWheelPickerProps {
    isOpen: boolean;
    initialTime: string; // "HH:mm"
    onConfirm: (time: string) => void;
    onClose: () => void;
}

const TimeWheelPicker: React.FC<TimeWheelPickerProps> = ({ isOpen, initialTime, onConfirm, onClose }) => {
    const [mounted, setMounted] = useState(false);
    const [selectedHour, setSelectedHour] = useState(8);
    const [selectedMinute, setSelectedMinute] = useState(0);

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        if (initialTime && initialTime.includes(':')) {
            const [h, m] = initialTime.split(':').map(Number);
            setSelectedHour(isNaN(h) ? 8 : h);
            setSelectedMinute(isNaN(m) ? 0 : m);
        }
    }, [initialTime, isOpen]);

    useEffect(() => {
        if (isOpen && mounted) {
            // Slight delay to ensure DOM is ready for scrolling
            const timer = setTimeout(() => {
                scrollToValue(hourRef, selectedHour);
                scrollToValue(minuteRef, selectedMinute);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, mounted]);

    const scrollToValue = (ref: React.RefObject<HTMLDivElement | null>, value: number) => {
        if (ref.current) {
            const itemHeight = 40; // Height of each row
            ref.current.scrollTop = value * itemHeight;
        }
    };

    const handleScroll = (ref: React.RefObject<HTMLDivElement | null>, setter: (v: number) => void) => {
        if (ref.current) {
            const itemHeight = 40;
            const scrollTop = ref.current.scrollTop;
            const index = Math.round(scrollTop / itemHeight);
            setter(index);
        }
    };

    const increment = (ref: React.RefObject<HTMLDivElement | null>, current: number, max: number) => {
        if (current < max) {
            scrollToValue(ref, current + 1);
        }
    };

    const decrement = (ref: React.RefObject<HTMLDivElement | null>, current: number) => {
        if (current > 0) {
            scrollToValue(ref, current - 1);
        }
    };

    if (!isOpen || !mounted) return null;

    const handleConfirm = () => {
        const time = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
        onConfirm(time);
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-2xl w-full max-w-[280px] overflow-hidden flex flex-col items-center p-6 animate-in fade-in zoom-in duration-200">
                
                {/* Picker Container */}
                <div className="relative w-full h-[260px] border border-[#CECFD2] dark:border-gray-800 rounded-[16px] bg-white dark:bg-[#222] mb-6 flex items-center justify-center overflow-hidden">
                    
                    {/* Selection Overlay (The two lines) */}
                    <div className="absolute top-1/2 left-4 right-4 h-12 -translate-y-1/2 border-y border-[#CECFD2] dark:border-gray-700 pointer-events-none z-10"></div>

                    {/* Colon Separator */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[24px] font-bold text-gray-400 z-10">:</div>

                    {/* Columns Wrapper */}
                    <div className="flex w-full h-full px-2 justify-center gap-2">
                        
                        {/* Hour Column */}
                        <div className="w-20 flex flex-col items-center">
                            {/* Up Arrow */}
                            <button 
                                onClick={() => decrement(hourRef, selectedHour)}
                                className="h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-20"
                            >
                                <span className="material-symbols-rounded !text-[28px]">expand_less</span>
                            </button>

                            <div 
                                ref={hourRef}
                                onScroll={() => handleScroll(hourRef, setSelectedHour)}
                                className="w-full h-[180px] overflow-y-auto snap-y snap-mandatory scrollbar-hide py-[70px]"
                            >
                                {hours.map((h, i) => (
                                    <div 
                                        key={h} 
                                        className={`h-10 flex items-center justify-center text-[16px] snap-center transition-all duration-200 ${selectedHour === i ? 'font-medium text-[#61646C] dark:text-white scale-110' : 'text-gray-300 dark:text-gray-600'}`}
                                    >
                                        {h}
                                    </div>
                                ))}
                            </div>

                            {/* Down Arrow */}
                            <button 
                                onClick={() => increment(hourRef, selectedHour, 23)}
                                className="h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-20"
                            >
                                <span className="material-symbols-rounded !text-[28px]">expand_more</span>
                            </button>
                        </div>

                        {/* Gap and Minute Column */}
                        <div className="w-20 flex flex-col items-center">
                             {/* Up Arrow */}
                             <button 
                                onClick={() => decrement(minuteRef, selectedMinute)}
                                className="h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-20"
                            >
                                <span className="material-symbols-rounded !text-[28px]">expand_less</span>
                            </button>

                            <div 
                                ref={minuteRef}
                                onScroll={() => handleScroll(minuteRef, setSelectedMinute)}
                                className="w-full h-[180px] overflow-y-auto snap-y snap-mandatory scrollbar-hide py-[70px]"
                            >
                                {minutes.map((m, i) => (
                                    <div 
                                        key={m} 
                                        className={`h-10 flex items-center justify-center text-[16px] snap-center transition-all duration-200 ${selectedMinute === i ? 'font-medium text-[#61646C] dark:text-white scale-110' : 'text-gray-300 dark:text-gray-600'}`}
                                    >
                                        {m}
                                    </div>
                                ))}
                            </div>

                            {/* Down Arrow */}
                            <button 
                                onClick={() => increment(minuteRef, selectedMinute, 59)}
                                className="h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-20"
                            >
                                <span className="material-symbols-rounded !text-[28px]">expand_more</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 w-full">
                    <button
                        onClick={onClose}
                        className="flex-1 h-12 rounded-[5px] bg-gray-50 dark:bg-gray-800 border border-[#D0D5DD] dark:border-gray-700 dark:text-gray-300 font-medium text-[16px] text-[#344054] active:scale-95 transition-transform"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 h-12 rounded-[5px] bg-[#A80689] text-white font-medium text-[16px] shadow-lg shadow-purple-100 dark:shadow-none active:scale-95 transition-transform"
                    >
                        ยืนยัน
                    </button>
                </div>
            </div>
            
            {/* Custom CSS for hiding scrollbars */}
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none; /* IE and Edge */
                    scrollbar-width: none; /* Firefox */
                }
            `}</style>
        </div>,
        document.body
    );
};

export default TimeWheelPicker;
