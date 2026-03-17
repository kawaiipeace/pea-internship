'use client';
import React, { useState, useRef, useEffect } from 'react';

interface MonthPickerProps {
    currentMonth: number;
    currentYear: number;
    onSelect: (month: number, year: number) => void;
}

const MonthPicker: React.FC<MonthPickerProps> = ({ currentMonth, currentYear, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(currentYear);
    const [tempMonth, setTempMonth] = useState(currentMonth);
    const popupRef = useRef<HTMLDivElement>(null);

    const monthLabels = ['Jan', 'Fab', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    useEffect(() => {
        if (isOpen) {
            setPickerYear(currentYear);
            setTempMonth(currentMonth);
        }
    }, [isOpen, currentYear, currentMonth]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleOk = () => {
        onSelect(tempMonth, pickerYear);
        setIsOpen(false);
    };

    const handleClear = () => {
        setTempMonth(currentMonth);
        setPickerYear(currentYear);
    };

    return (
        <div className="relative" ref={popupRef}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-200 cursor-pointer mx-2 sm:mx-4"
            >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>{['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][currentMonth]} {currentYear}</span>
            </button>

            {/* Popup */}
            {isOpen && (
                <div className="absolute top-full mt-2 -right-8 z-[100] bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-[260px]">
                    {/* Year navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={() => setPickerYear(pickerYear - 1)} className="p-1 text-gray-600 dark:text-gray-400 hover:text-primary">
                            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{pickerYear - 543}</span>
                        <button type="button" onClick={() => setPickerYear(pickerYear + 1)} className="p-1 text-gray-600 dark:text-gray-400 hover:text-primary">
                            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>

                    {/* Month grid */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {monthLabels.map((label, index) => {
                            const isSelected = tempMonth === index && pickerYear === currentYear;
                            const isCurrent = currentMonth === index && currentYear === pickerYear;
                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setTempMonth(index)}
                                    className={`py-2 px-1 rounded-full text-xs font-semibold transition-all
                                        ${tempMonth === index 
                                            ? 'bg-[#A80689] text-white shadow-md' 
                                            : isCurrent
                                                ? 'bg-[#FDF2E2] text-[#A80689] border border-[#A80689]'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={handleOk}
                            className="flex-1 py-2 bg-[#A80689] text-white rounded-full text-xs font-bold shadow-md hover:bg-[#A80689]/90 transition-colors"
                        >
                            Ok
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthPicker;
