'use client';

import React, { useState, useEffect, useRef } from 'react';
import ClickAwayListener from 'react-click-away-listener';

interface CustomDatePickerProps {
    value?: string; // YYYY-MM-DD (Single Mode)
    onChange?: (date: string) => void; // (Single Mode)
    multiple?: boolean;
    range?: boolean; // New prop for range selection
    selectedDates?: string[]; // (Multiple/Range Mode)
    onDatesChange?: (dates: string[]) => void; // (Multiple/Range Mode)
    placeholder?: string;
    error?: string;
    minDate?: Date | string | 'today'; // New prop to disable past dates
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, multiple, range, selectedDates = [], onDatesChange, placeholder, error, minDate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const [internalSelectedDate, setInternalSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
    const [internalMultipleDates, setInternalMultipleDates] = useState<string[]>(selectedDates);
    const [hoverDate, setHoverDate] = useState<string | null>(null);
    const [showMonthSelector, setShowMonthSelector] = useState(false);
    const [showYearSelector, setShowYearSelector] = useState(false);

    // Parse minDate
    const getMinDate = () => {
        if (!minDate) return null;
        if (minDate === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
        }
        const d = new Date(minDate);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const minDateObj = getMinDate();

    // Sync internal state when external value changes
    useEffect(() => {
        if (!multiple && !range) {
            if (value) {
                const d = new Date(value);
                setInternalSelectedDate(d);
                setViewDate(d);
            } else {
                setInternalSelectedDate(null);
            }
        } else {
            setInternalMultipleDates(selectedDates);
            if (selectedDates.length > 0 && !isOpen) {
                // For range mode, if multiple dates are passed, we might want to just show the first one's month
                setViewDate(new Date(selectedDates[0]));
            }
        }
    }, [value, selectedDates, multiple, range, isOpen]);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthsShort = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
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

    const handleMonthSelectDirect = (monthIndex: number) => {
        setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
        setShowMonthSelector(false);
    };

    const handleYearSelectDirect = (year: number) => {
        setViewDate(new Date(year, viewDate.getMonth(), 1));
        setShowYearSelector(false);
    };

    const handleDateSelect = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        
        // Check if date is disabled
        if (minDateObj && newDate < minDateObj) return;

        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(newDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayStr}`;

        if (range) {
            if (internalMultipleDates.length === 0 || internalMultipleDates.length === 2) {
                // Start a new range
                setInternalMultipleDates([dateStr]);
            } else if (internalMultipleDates.length === 1) {
                // Complete the range
                const start = internalMultipleDates[0];
                const end = dateStr;
                
                // Sort dates to ensure start is before end
                const sorted = [start, end].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
                setInternalMultipleDates(sorted);
            }
        } else if (multiple) {
            const newDates = internalMultipleDates.includes(dateStr)
                ? internalMultipleDates.filter(d => d !== dateStr)
                : [...internalMultipleDates, dateStr];
            setInternalMultipleDates(newDates);
        } else {
            setInternalSelectedDate(newDate);
        }
    };

    const handleOk = () => {
        if (range) {
            if (onDatesChange) {
                if (internalMultipleDates.length === 2) {
                    // Expand range to all dates in between
                    const start = new Date(internalMultipleDates[0]);
                    const end = new Date(internalMultipleDates[1]);
                    const allDates: string[] = [];
                    let curr = new Date(start);
                    while (curr <= end) {
                        const y = curr.getFullYear();
                        const m = String(curr.getMonth() + 1).padStart(2, '0');
                        const d = String(curr.getDate()).padStart(2, '0');
                        allDates.push(`${y}-${m}-${d}`);
                        curr.setDate(curr.getDate() + 1);
                    }
                    onDatesChange(allDates);
                } else if (internalMultipleDates.length === 1) {
                    onDatesChange(internalMultipleDates);
                }
            }
        } else if (multiple) {
            if (onDatesChange) {
                const sortedDates = [...internalMultipleDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
                onDatesChange(sortedDates);
            }
        } else if (internalSelectedDate) {
            const year = internalSelectedDate.getFullYear();
            const month = String(internalSelectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(internalSelectedDate.getDate()).padStart(2, '0');
            if (onChange) onChange(`${year}-${month}-${day}`);
        }
        setIsOpen(false);
    };

    const handleClear = () => {
        if (multiple || range) {
            setInternalMultipleDates([]);
            if (onDatesChange) onDatesChange([]);
        } else {
            setInternalSelectedDate(null);
            if (onChange) onChange('');
        }
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

    const formatMultipleDatesDisplay = (dates: string[]) => {
        if (!dates || dates.length === 0) return '';
        
        if (range) {
            if (dates.length === 1) return formatDateDisplay(dates[0]);
            // If it's range mode and we have many dates, it means it's already expanded or it's start/end
            // We want to show "Start - End"
            const start = dates[0];
            const end = dates[dates.length - 1];
            return `${formatDateDisplay(start)} - ${formatDateDisplay(end)}`;
        }

        const sortedDates = [...dates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const formatted = sortedDates.map(d => formatDateDisplay(d));
        return formatted.join(' - ');
    };

    const isDateSelected = (dateStr: string) => {
        if (range) {
            if (internalMultipleDates.length === 2) {
                const start = new Date(internalMultipleDates[0]).getTime();
                const end = new Date(internalMultipleDates[1]).getTime();
                const current = new Date(dateStr).getTime();
                return current >= start && current <= end;
            }
            return internalMultipleDates.includes(dateStr);
        }
        return internalMultipleDates.includes(dateStr);
    };

    const isDateInRange = (dateStr: string) => {
        if (!range || internalMultipleDates.length !== 1 || !hoverDate) return false;
        
        const start = new Date(internalMultipleDates[0]).getTime();
        const hover = new Date(hoverDate).getTime();
        const current = new Date(dateStr).getTime();
        
        const rangeStart = Math.min(start, hover);
        const rangeEnd = Math.max(start, hover);
        
        return current >= rangeStart && current <= rangeEnd;
    };

    // Years range: Centered around viewDate year +/- 12 years to ensure we can always go further
    const viewYear = viewDate.getFullYear();
    const years = Array.from({ length: 25 }, (_, i) => viewYear - 12 + i);

    return (
        <div className="relative w-full">
            <div 
                onClick={() => setIsOpen(true)}
                className={`w-full h-[45px] px-4 bg-white dark:bg-gray-900 border ${error ? 'border-[#D92D20]' : 'border-[#E4E7EC]'} dark:border-gray-700 rounded-[8px] text-[14px] flex items-center cursor-pointer focus:outline-none transition-colors`}
            >
                <span className={((multiple || range) ? internalMultipleDates.length > 0 : value) ? 'text-[#101828] dark:text-white' : 'text-[#9ca3af]'}>
                    {(multiple || range) 
                        ? (internalMultipleDates.length > 0 ? formatMultipleDatesDisplay(internalMultipleDates) : placeholder || 'เลือกวันที่')
                        : (value ? formatDateDisplay(value) : placeholder || 'วว/ดด/ปปปป')
                    }
                </span>
            </div>
            
            {error && <p className="text-[#D92D20] text-[12px] mt-0.5">{error}</p>}

            {isOpen && (
                <div className="absolute top-[50px] left-0 z-[100]">
                    <ClickAwayListener onClickAway={() => {
                        setIsOpen(false);
                        setShowMonthSelector(false);
                        setShowYearSelector(false);
                    }}>
                        <div className="bg-white dark:bg-[#121212] w-[348px] h-[358px] rounded-[16px] shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col justify-between">
                            <div className="p-3 w-full flex flex-col items-center">
                                <div className="w-[252px]">
                                    <div className="flex items-center justify-between mb-3">
                                        <button 
                                            onClick={handlePrevMonth} 
                                            disabled={showMonthSelector || showYearSelector}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-0"
                                        >
                                            <span className="material-symbols-rounded text-[20px] text-gray-600 dark:text-gray-400">arrow_back</span>
                                        </button>
                                        <div className="flex items-center gap-1.5">
                                            <button 
                                                onClick={() => {
                                                    setShowMonthSelector(!showMonthSelector);
                                                    setShowYearSelector(false);
                                                }}
                                                className={`text-[17px] font-bold text-[#101828] dark:text-white hover:text-[#A80689] transition-colors ${showMonthSelector ? 'text-[#A80689]' : ''}`}
                                            >
                                                {months[viewDate.getMonth()]}
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setShowYearSelector(!showYearSelector);
                                                    setShowMonthSelector(false);
                                                }}
                                                className={`text-[17px] font-bold text-[#101828] dark:text-white hover:text-[#A80689] transition-colors ${showYearSelector ? 'text-[#A80689]' : ''}`}
                                            >
                                                {viewDate.getFullYear() + 543}
                                            </button>
                                        </div>
                                        <button 
                                            onClick={handleNextMonth} 
                                            disabled={showMonthSelector || showYearSelector}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-0"
                                        >
                                            <span className="material-symbols-rounded text-[20px] text-gray-600 dark:text-gray-400">arrow_forward</span>
                                        </button>
                                    </div>

                                    <div className="relative h-[215px]">
                                        {/* Month Selector Overlay */}
                                        {showMonthSelector && (
                                            <div className="absolute inset-0 bg-white dark:bg-[#121212] z-10 grid grid-cols-3 gap-2">
                                                {monthsShort.map((month, index) => (
                                                    <button
                                                        key={month}
                                                        onClick={() => handleMonthSelectDirect(index)}
                                                        className={`h-12 rounded-lg text-sm font-semibold transition-all ${viewDate.getMonth() === index ? 'bg-[#A80689] text-white' : 'hover:bg-[#FDF2FE] text-gray-700 dark:text-gray-300'}`}
                                                    >
                                                        {month}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Year Selector Overlay */}
                                        {showYearSelector && (
                                            <div className="absolute inset-0 bg-white dark:bg-[#121212] z-10 overflow-y-auto pr-1 grid grid-cols-3 gap-2 scrollbar-thin scrollbar-thumb-gray-200">
                                                {years.map((year) => (
                                                    <button
                                                        key={year}
                                                        onClick={() => handleYearSelectDirect(year)}
                                                        className={`h-12 rounded-lg text-sm font-semibold transition-all ${viewDate.getFullYear() === year ? 'bg-[#A80689] text-white' : 'hover:bg-[#FDF2FE] text-gray-700 dark:text-gray-300'}`}
                                                    >
                                                        {year + 543}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {!showMonthSelector && !showYearSelector && (
                                            <>
                                                <div className="grid grid-cols-7 mb-1">
                                                    {daysOfWeek.map(day => (
                                                        <div key={day} className="w-[36px] h-7 flex items-center justify-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                                            {day}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="grid grid-cols-7 h-[180px]">
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
                                                            const dayDate = new Date(year, month, day);
                                                            const dayStr = String(day).padStart(2, '0');
                                                            const monthStr = String(month + 1).padStart(2, '0');
                                                            const dateStr = `${year}-${monthStr}-${dayStr}`;

                                                            const isSelected = multiple || range
                                                                ? isDateSelected(dateStr)
                                                                : (internalSelectedDate && internalSelectedDate.getDate() === day && internalSelectedDate.getMonth() === month && internalSelectedDate.getFullYear() === year);
                                                            
                                                            const isInRange = isDateInRange(dateStr);
                                                            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                                                            const isDisabled = minDateObj && dayDate < minDateObj;

                                                            // Range visual logic
                                                            const isRangeStart = range && internalMultipleDates.length >= 1 && internalMultipleDates[0] === dateStr;
                                                            const isRangeEnd = range && internalMultipleDates.length === 2 && internalMultipleDates[1] === dateStr;
                                                            const isHoverEnd = range && internalMultipleDates.length === 1 && hoverDate === dateStr;

                                                            let bgClass = isDisabled ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'hover:bg-[#FDF2FE] text-[#101828]';
                                                            let roundedClass = 'rounded-[4px]';

                                                            if (!isDisabled && (isSelected || isInRange)) {
                                                                bgClass = 'bg-[#A80689] text-white font-bold';
                                                                if (range) {
                                                                    const start = internalMultipleDates[0];
                                                                    const end = internalMultipleDates.length === 2 ? internalMultipleDates[1] : hoverDate;
                                                                    
                                                                    if (start && end) {
                                                                        const sTime = new Date(start).getTime();
                                                                        const eTime = new Date(end).getTime();
                                                                        const cTime = new Date(dateStr).getTime();
                                                                        const realStart = Math.min(sTime, eTime);
                                                                        const realEnd = Math.max(sTime, eTime);

                                                                        if (cTime === realStart && cTime === realEnd) {
                                                                            roundedClass = 'rounded-[8px]';
                                                                        } else if (cTime === realStart) {
                                                                            roundedClass = 'rounded-l-[8px] rounded-r-none';
                                                                        } else if (cTime === realEnd) {
                                                                            roundedClass = 'rounded-r-[8px] rounded-l-none';
                                                                        } else if (cTime > realStart && cTime < realEnd) {
                                                                            roundedClass = 'rounded-none';
                                                                            bgClass = 'bg-[#A80689]/10 text-[#A80689] font-bold';
                                                                        }
                                                                    }
                                                                }
                                                            }

                                                            calendarDays.push(
                                                                <div 
                                                                    key={day}
                                                                    onClick={() => !isDisabled && handleDateSelect(day)}
                                                                    onMouseEnter={() => !isDisabled && range && setHoverDate(dateStr)}
                                                                    onMouseLeave={() => !isDisabled && range && setHoverDate(null)}
                                                                    className={`h-[30px] w-[36px] flex items-center justify-center text-[14px] transition-all
                                                                        ${!isDisabled ? 'cursor-pointer' : ''}
                                                                        ${bgClass}
                                                                        ${roundedClass}
                                                                        ${isToday && !isSelected && !isInRange ? 'border border-[#A80689]/30' : ''}
                                                                    `}
                                                                >
                                                                    {day}
                                                                </div>
                                                            );
                                                        }
                                                        return calendarDays;
                                                    })()}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

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
