'use client';

import React, { useState, useEffect, useRef } from 'react';
import ClickAwayListener from 'react-click-away-listener';

interface CustomDatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    placeholder?: string;
    error?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, placeholder, error }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);

    // Sync internal state when external value changes
    useEffect(() => {
        if (value) {
            const d = new Date(value);
            setSelectedDate(d);
            setViewDate(d);
        } else {
            setSelectedDate(null);
        }
    }, [value]);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDateSelect = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        setSelectedDate(newDate);
    };

    const handleOk = () => {
        if (selectedDate) {
            // Format to YYYY-MM-DD for consistency
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            onChange(`${year}-${month}-${day}`);
        }
        setIsOpen(false);
    };

    const handleClear = () => {
        setSelectedDate(null);
        onChange('');
        setIsOpen(false);
    };

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear() + 543; // Buddhist year
        return `${day}/${month}/${year}`;
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        
        const calendarDays = [];
        
        // Padding for previous month days
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="h-[34px] w-[36px]"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isSelected = selectedDate && 
                selectedDate.getDate() === day && 
                selectedDate.getMonth() === month && 
                selectedDate.getFullYear() === year;
            
            const isToday = new Date().getDate() === day && 
                new Date().getMonth() === month && 
                new Date().getFullYear() === year;

            calendarDays.push(
                <div 
                    key={day}
                    onClick={() => handleDateSelect(day)}
                    className={`h-[34px] w-[36px] flex items-center justify-center text-[14px] cursor-pointer rounded-[8px] transition-all
                        ${isSelected ? 'bg-[#A80689] text-white font-bold' : 'hover:bg-[#FDF2FE] text-[#101828]'}
                        ${isToday && !isSelected ? 'border border-[#A80689]/30' : ''}
                    `}
                >
                    {day}
                </div>
            );
        }

        return calendarDays;
    };

    return (
        <div className="relative w-full">
            {/* Input Overlay */}
            <div 
                onClick={() => setIsOpen(true)}
                className={`w-full h-[45px] px-4 bg-white dark:bg-gray-900 border ${error ? 'border-[#D92D20]' : 'border-[#E4E7EC]'} dark:border-gray-700 rounded-[8px] text-[14px] flex items-center cursor-pointer focus:outline-none transition-colors`}
            >
                <span className={value ? 'text-[#101828] dark:text-white' : 'text-[#9ca3af]'}>
                    {value ? formatDateDisplay(value) : placeholder || 'วว/ดด/ปปปป'}
                </span>
                
            </div>
            
            {error && <p className="text-[#D92D20] text-[12px] mt-0.5">{error}</p>}

            {/* Calendar Dropdown */}
            {isOpen && (
                <div className="absolute top-[50px] left-0 z-[100]">
                    <ClickAwayListener onClickAway={() => setIsOpen(false)}>
                        <div className="bg-white dark:bg-[#121212] w-[348px] h-[350px] rounded-[16px] shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col justify-between">
                            {/* Calendar Content Area */}
                            <div className="p-3 w-full flex flex-col items-center">
                                <div className="w-[252px]">
                                    {/* Month/Year Nav */}
                                    <div className="flex items-center justify-between mb-3">
                                        <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                            <span className="material-symbols-rounded text-[20px] text-gray-600 dark:text-gray-400">arrow_back</span>
                                        </button>
                                        <h3 className="text-[17px] font-bold text-[#101828] dark:text-white">
                                            {months[viewDate.getMonth()]} {viewDate.getFullYear() + 543}
                                        </h3>
                                        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                            <span className="material-symbols-rounded text-[20px] text-gray-600 dark:text-gray-400">arrow_forward</span>
                                        </button>
                                    </div>

                                    {/* Weekdays */}
                                    <div className="grid grid-cols-7 mb-1">
                                        {daysOfWeek.map(day => (
                                            <div key={day} className="w-[36px] h-7 flex items-center justify-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Days Grid */}
                                    <div className="grid grid-cols-7 h-[180px]">
                                        {/* Updated Cell Size to fit */}
                                        {(() => {
                                            const year = viewDate.getFullYear();
                                            const month = viewDate.getMonth();
                                            const daysInMonth = getDaysInMonth(year, month);
                                            const firstDay = getFirstDayOfMonth(year, month);
                                            const calendarDays = [];
                                            for (let i = 0; i < firstDay; i++) {
                                                calendarDays.push(<div key={`empty-${i}`} className="h-[30px] w-[36px]"></div>);
                                            }
                                            for (let day = 1; day <= daysInMonth; day++) {
                                                const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
                                                const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                                                calendarDays.push(
                                                    <div 
                                                        key={day}
                                                        onClick={() => handleDateSelect(day)}
                                                        className={`h-[30px] w-[36px] flex items-center justify-center text-[14px] cursor-pointer rounded-[4px] transition-all
                                                            ${isSelected ? 'bg-[#A80689] text-white font-bold' : 'hover:bg-[#FDF2FE] text-[#101828]'}
                                                            ${isToday && !isSelected ? 'border border-[#A80689]/30' : ''}
                                                        `}
                                                    >
                                                        {day}
                                                    </div>
                                                );
                                            }
                                            return calendarDays;
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex gap-3 p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#121212]">
                                <button 
                                    onClick={handleClear}
                                    className="flex-1 h-[40px] rounded-[12px] border border-[#E4E7EC] dark:border-gray-700 text-[#4B5563] dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Clear
                                </button>
                                <button 
                                    onClick={handleOk}
                                    className="flex-1 h-[40px] rounded-[12px] bg-[#A80689] text-white font-bold hover:bg-[#8e0574] transition-colors shadow-md shadow-[#A80689]/20"
                                >
                                    Ok
                                </button>
                            </div>
                        </div>
                    </ClickAwayListener>
                </div>
            )}
        </div>
    );
};

export default CustomDatePicker;
