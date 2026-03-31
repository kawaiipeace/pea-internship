import { FC } from 'react';

interface IconCalendarClockProps {
    className?: string;
}

const IconCalendarClock: FC<IconCalendarClockProps> = ({ className }) => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            {/* Calendar Body */}
            <path
                d="M4 8V17C4 18.8856 4 19.8284 4.58579 20.4142C5.17157 21 6.11438 21 8 21H11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M20 12V8C20 6.11438 20 5.17157 19.4142 4.58579C18.8284 4 17.8856 4 16 4H8C6.11438 4 5.17157 4 4.58579 4.58579C4 5.17157 4 6.11438 4 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M4 9H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M8 3V5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M16 3V5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            
            {/* Clock in Corner */}
            <circle cx="17" cy="17" r="5" fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
            <path
                d="M17 15V17L18.5 18.5"
                stroke="white"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default IconCalendarClock;
