import React from 'react';

interface LocationStatusProps {
    status: 'searching' | 'found' | 'outside';
    isOffsiteToday: boolean;
    onRefresh: () => void;
    viewType: 'desktop' | 'mobile';
}

const LocationStatus: React.FC<LocationStatusProps> = ({ status, isOffsiteToday, onRefresh, viewType }) => {
    if (viewType === 'desktop') {
        const renderDesktop = () => {
            if (status === 'searching') {
                return (
                    <div
                        className="flex flex-row items-center w-[180px] h-[40px] gap-[10px] cursor-pointer transition-all select-none bg-[#F3F4F6] rounded-[25px] pr-4 overflow-hidden"
                        onClick={onRefresh}
                        title="คลิกเพื่อรีเฟรชตำแหน่ง"
                    >
                        <div className="rounded-full flex items-center justify-center w-[40px] h-[40px] shrink-0 bg-[#CECFD2]">
                            <div className="bg-[#85888E] text-white rounded-full flex items-center justify-center w-[30px] h-[30px]">
                                <span className="material-symbols-rounded text-[20px]">location_on</span>
                            </div>
                        </div>
                        <div className="flex-1 text-center font-medium text-[13px] text-[#333741] whitespace-nowrap">กำลังค้นหาตำแหน่ง...</div>
                    </div>
                );
            } else if (status === 'outside') {
                return (
                    <div
                        className="flex flex-row items-center w-[180px] h-[40px] gap-[10px] cursor-pointer transition-all select-none bg-[#FAF0DB] rounded-[25px] pr-4 overflow-hidden"
                        onClick={onRefresh}
                        title="คลิกเพื่อรีเฟรชตำแหน่ง"
                    >
                        <div className="rounded-full flex items-center justify-center w-[40px] h-[40px] shrink-0 bg-[#EDC878]">
                            <div className="bg-[#E2A727] text-white rounded-full flex items-center justify-center w-[30px] h-[30px]">
                                <span className="material-symbols-rounded text-[20px]">location_on</span>
                            </div>
                        </div>
                        <div className="flex-1 text-center font-medium text-[13px] text-[#333741] whitespace-nowrap">อยู่นอกสถานที่</div>
                    </div>
                );
            } else {
                return (
                    <div
                        className="flex flex-row items-center w-[180px] h-[40px] gap-[10px] cursor-pointer transition-all select-none bg-[#D1FADF] rounded-[25px] pr-4 overflow-hidden"
                        onClick={onRefresh}
                        title="คลิกเพื่อรีเฟรชตำแหน่ง"
                    >
                        <div className="rounded-full flex items-center justify-center w-[40px] h-[40px] shrink-0 bg-[#75E0A7]">
                            <div className="bg-[#42B86F] text-white rounded-full flex items-center justify-center w-[30px] h-[30px]">
                                <span className="material-symbols-rounded text-[20px]">location_on</span>
                            </div>
                        </div>
                        <div className="flex-1 text-center font-medium text-[13px] text-[#333741] whitespace-nowrap">อยู่ในสถานที่</div>
                    </div>
                );
            }
        };

        return (
            <div className="mt-14 mb-[70px] z-10 flex flex-col items-center">
                {renderDesktop()}
                {isOffsiteToday && (
                    <div className="text-[16px] font-normal text-[#996F15] mt-4 text-center">
                        มีกำหนดการปฏิบัติงานนอกสถานที่
                    </div>
                )}
            </div>
        );
    }

    const renderMobile = () => {
        if (status === 'searching') {
            return (
                <div
                    className="flex flex-col items-center justify-center gap-[8px] cursor-pointer transition-all select-none"
                    onClick={onRefresh}
                    title="คลิกเพื่อรีเฟรชตำแหน่ง"
                >
                    <div className="rounded-full flex items-center justify-center w-[40px] h-[40px] bg-[#CECFD2]">
                        <div className="bg-[#85888E] text-white rounded-full flex items-center justify-center w-[30px] h-[30px]">
                            <span className="material-symbols-rounded text-[24px]">location_on</span>
                        </div>
                    </div>
                    <div className="font-medium text-[15px] text-[#333741] dark:text-white-light whitespace-nowrap">กำลังค้นหาตำแหน่ง...</div>
                </div>
            );
        } else if (status === 'outside') {
            return (
                <div
                    className="flex flex-col items-center justify-center gap-[8px] cursor-pointer transition-all select-none"
                    onClick={onRefresh}
                    title="คลิกเพื่อรีเฟรชตำแหน่ง"
                >
                    <div className="rounded-full flex items-center justify-center w-[40px] h-[40px] bg-[#F97066]" >
                        <div className="bg-[#F04438] text-[#FEF3F2] rounded-full flex items-center justify-center w-[30px] h-[30px]">
                            <span className="material-symbols-rounded text-[24px]">location_on</span>
                        </div>
                    </div>
                    <div className="font-medium text-[15px] text-[#333741] dark:text-white-light whitespace-nowrap">อยู่นอกสถานที่</div>
                </div>
            );
        } else {
            return (
                <div
                    className="flex flex-col items-center justify-center gap-[8px] cursor-pointer transition-all select-none"
                    onClick={onRefresh}
                    title="คลิกเพื่อรีเฟรชตำแหน่ง"
                >
                    <div className="rounded-full flex items-center justify-center w-[40px] h-[40px] bg-[#75E0A7]" >
                        <div className="bg-[#42B86F] text-[#E4F5EA] rounded-full flex items-center justify-center w-[30px] h-[30px]">
                            <span className="material-symbols-rounded text-[24px]">location_on</span>
                        </div>
                    </div>
                    <div className="font-medium text-[15px] text-[#333741] dark:text-white-light whitespace-nowrap">อยู่ในสถานที่</div>
                </div>
            );
        }
    };

    return (
        <div className="mt-[64px] flex flex-col items-center">
            {renderMobile()}
            {isOffsiteToday && (
                <div className="text-[14px] font-normal text-[#996F15] mt-2 text-center">
                    มีกำหนดการปฏิบัติงานนอกสถานที่
                </div>
            )}
        </div>
    );
};

export default LocationStatus;
