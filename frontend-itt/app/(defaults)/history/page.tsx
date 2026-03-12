import React from 'react';

const AttendanceHistoryPage = () => {
    return (
        <div>
            <h1 className="text-2xl font-semibold mb-4 text-black dark:text-white-light">ประวัติการลงเวลา</h1>
            {/* Content for Attendance History goes here */}
            <div className="panel">
                <div className="table-responsive">
                    <p>ไม่มีประวัติการลงเวลา</p>
                </div>
            </div>
        </div>
    );
};

export default AttendanceHistoryPage;
