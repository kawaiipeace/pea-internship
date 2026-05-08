import React, { useMemo } from 'react';
import Flatpickr from 'react-flatpickr';
import IconXCircle from '@/components/icon/icon-x-circle';
import IconCaretDown from '@/components/icon/icon-caret-down';
import Dropdown from '@/components/dropdown';

interface StudentFilterProps {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    confirmedDateStr: string;
    setConfirmedDateStr: (val: string) => void;
    dateRange: any;
    setDateRange: (val: any) => void;
    statusFilter: string;
    setStatusFilter: (val: string) => void;
    flatpickrRef: any;
}

const StudentFilter: React.FC<StudentFilterProps> = ({
    searchTerm,
    setSearchTerm,
    confirmedDateStr,
    setConfirmedDateStr,
    dateRange,
    setDateRange,
    statusFilter,
    setStatusFilter,
    flatpickrRef,
}) => {
    const flatpickrOptions = useMemo(() => ({
        mode: 'range' as const,
        dateFormat: 'd/m/Y',
        closeOnSelect: false,
        disableMobile: true,
        locale: {
            rangeSeparator: ' - ',
        },
        onReady: (_selectedDates: Date[], _dateStr: string, instance: any) => {
            instance._okClicked = false;
            const calendarContainer = instance.calendarContainer;
            if (calendarContainer.querySelector('.custom-btn-container')) return;

            const btnContainer = document.createElement('div');
            btnContainer.classList.add('custom-btn-container');
            btnContainer.style.cssText =
                'display:flex;justify-content:center;gap:12px;padding:12px;border-top:1px solid #E5E7EB;background:#fff;border-bottom-left-radius:8px;border-bottom-right-radius:8px;';

            const clearBtn = document.createElement('button');
            clearBtn.textContent = 'Clear';
            clearBtn.type = 'button';
            clearBtn.style.cssText =
                'flex:1;padding:12px;border-radius:24px;border:1px solid #E5E7EB;background:#fff;color:#4B5563;font-weight:600;font-size:18px;cursor:pointer;';
            clearBtn.addEventListener('click', () => {
                instance.clear();
                setConfirmedDateStr('');
                setDateRange('');
            });

            const okBtn = document.createElement('button');
            okBtn.textContent = 'Ok';
            okBtn.type = 'button';
            okBtn.style.cssText =
                'flex:1;padding:12px;border-radius:24px;border:none;background:#A80689;color:#fff;font-weight:600;font-size:18px;cursor:pointer;';
            okBtn.addEventListener('click', () => {
                instance._okClicked = true;
                instance.close();
            });

            btnContainer.appendChild(clearBtn);
            btnContainer.appendChild(okBtn);
            calendarContainer.appendChild(btnContainer);
        },
        onClose: (selectedDates: Date[], dateStr: string, instance: any) => {
            if (instance._okClicked) {
                setDateRange(selectedDates);
                setConfirmedDateStr(dateStr);
                instance._okClicked = false;
            } else {
                if (Array.isArray(dateRange) && dateRange.length > 0) {
                    instance.setDate(dateRange, false);
                } else {
                    instance.clear();
                }
            }
        }
    }), [dateRange, setDateRange, setConfirmedDateStr]);

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
            <div className="relative w-full sm:w-[328px] h-[36px] shrink-0">
                <span className="absolute inset-y-0 left-[12px] flex items-center text-[#667085] pointer-events-none">
                    <span className="material-symbols-outlined select-none text-[20px]">search</span>
                </span>
                <input
                    type="text"
                    placeholder="พิมพ์ชื่อ, ตำแหน่ง หรือมหาวิทยาลัย..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-full pl-[42px] pr-[12px] bg-white border border-[#CECFD2] rounded-[5px] outline-none text-[14px] text-[#101828] placeholder:text-[#61646C] transition-all"
                />
            </div>

            <div className="relative w-full sm:w-[348px] h-[36px] shrink-0">
                <Flatpickr
                    ref={flatpickrRef}
                    value={confirmedDateStr}
                    options={flatpickrOptions}
                    className="w-full h-full px-[12px] bg-white border border-[#CECFD2] rounded-[5px] outline-none text-[14px] text-[#101828] placeholder:text-[#61646C]"
                    placeholder="เลือกช่วงเวลาที่ต้องการดู..."
                />
                {confirmedDateStr && (
                    <button
                        type="button"
                        onClick={() => {
                            setDateRange('');
                            setConfirmedDateStr('');
                            if (flatpickrRef.current?.flatpickr) {
                                flatpickrRef.current.flatpickr.clear();
                            }
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-danger"
                    >
                        <IconXCircle className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="relative w-full sm:w-[220px] h-[36px] shrink-0">
                <Dropdown
                    btnClassName="w-full h-full"
                    button={
                        <div className="flex items-center justify-between w-full h-full px-[12px] bg-white border border-[#CECFD2] rounded-[5px] outline-none text-[14px] text-[#101828] cursor-pointer hover:border-[#A80689] transition-all">
                            <span className={statusFilter === 'ALL' ? 'text-[#61646C]' : 'text-[#101828]'}>
                                {statusFilter === 'ALL' ? 'ผลการพิจารณา: ทั้งหมด' : 
                                 statusFilter === 'COMPLETE' ? 'ผ่านการฝึกงาน' :
                                 statusFilter === 'EXTENDED' ? 'ชดเชยวันทำงาน' :
                                 statusFilter === 'AWAITING' ? 'รออนุมัติการฝึกงาน' : 'อยู่ในระหว่างฝึกงาน'}
                            </span>
                            <IconCaretDown className="w-4 h-4 opacity-70" />
                        </div>
                    }
                >
                    <ul className="bg-white shadow-xl rounded-lg border border-gray-100 py-1 min-w-[200px] overflow-hidden z-[110]">
                        {[
                            { label: 'ทั้งหมด', value: 'ALL' },
                            { label: 'ผ่านการฝึกงาน', value: 'COMPLETE' },
                            { label: 'ชดเชยวันทำงาน', value: 'EXTENDED' },
                            { label: 'รออนุมัติการฝึกงาน', value: 'AWAITING' },
                            { label: 'อยู่ในระหว่างฝึกงาน', value: 'ACTIVE' },
                        ].map((opt) => (
                            <li key={opt.value}>
                                <button
                                    onClick={() => setStatusFilter(opt.value)}
                                    className={`w-full text-left px-4 py-2 text-[14px] hover:bg-gray-50 flex items-center justify-between ${statusFilter === opt.value ? 'text-[#A80689] font-bold bg-pink-50/30' : 'text-gray-700'}`}
                                >
                                    {opt.label}
                                    {statusFilter === opt.value && <span className="material-symbols-outlined text-[18px]">check</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </Dropdown>
            </div>
        </div>
    );
};

export default StudentFilter;
