'use client';
import React, { useState, useRef, useEffect } from 'react';

interface MonthPickerProps {
    currentMonth: number | null;
    currentYear: number | null;
    onSelect: (month: number | null, year: number | null) => void;
    placeholder?: string;
}

const MonthPicker: React.FC<MonthPickerProps> = ({ currentMonth, currentYear, onSelect, placeholder = 'เลือกเดือน' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(currentYear || (new Date().getFullYear() + 543));
    const [tempMonth, setTempMonth] = useState<number | null>(currentMonth);
    const popupRef = useRef<HTMLDivElement>(null);

    const thaiMonthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const thaiMonthsFull = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const monthLabels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    useEffect(() => {
        if (isOpen) {
            setPickerYear(currentYear || (new Date().getFullYear() + 543));
            setTempMonth(currentMonth);
        }
    }, [isOpen, currentYear, currentMonth]);

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
        if (tempMonth !== null) {
            onSelect(tempMonth, pickerYear);
        }
        setIsOpen(false);
    };

    const handleClear = () => {
        onSelect(null, null);
        setIsOpen(false);
    };

    const today = new Date();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear() + 543;

    return (
        <div className="relative" ref={popupRef}>
            {/* Trigger Styled as Input */}
            <div className="relative w-full sm:w-[260px] h-[36px] shrink-0">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full h-full px-[12px] bg-white dark:bg-gray-900 border border-[#CECFD2] dark:border-gray-700 rounded-[5px] outline-none text-[14px] flex items-center justify-between cursor-pointer group"
                >
                    <span className={`truncate ${currentMonth !== null ? 'text-[#101828] dark:text-white' : 'text-[#61646C]'}`}>
                        {currentMonth !== null && currentYear !== null 
                            ? `${thaiMonthsFull[currentMonth]} ${currentYear}` 
                            : placeholder
                        }
                    </span>
                    <div className="flex items-center gap-1">
                        {currentMonth !== null && (
                            <div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClear();
                                }}
                                className="p-1 text-[#9CA3AF] hover:text-danger rounded-full transition-colors"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                            </div>
                        )}
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                </button>
            </div>

            {/* Popup */}
            {isOpen && (
                <div className="absolute top-full mt-2 right-0 z-[100] bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-[260px]">
                    {/* Year navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={() => setPickerYear(pickerYear - 1)} className="p-1 text-gray-600 dark:text-gray-400 hover:text-primary">
                            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{pickerYear}</span>
                        <button type="button" onClick={() => setPickerYear(pickerYear + 1)} className="p-1 text-gray-600 dark:text-gray-400 hover:text-primary">
                            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>

                    {/* Month grid 3x4 */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {monthLabels.map((label, index) => {
                            const isCurrent = todayMonth === index && todayYear === pickerYear;
                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setTempMonth(index)}
                                    className={`py-2 px-1 rounded-full text-xs font-semibold transition-all
                                        ${tempMonth === index
                                            ? 'bg-[#A80689] text-white shadow-md'
                                            : isCurrent
                                                ? 'bg-[#FDF2FE] text-[#A80689] border border-[#A80689]'
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
