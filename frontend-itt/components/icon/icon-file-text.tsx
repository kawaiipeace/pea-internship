import { FC } from 'react';

interface IconFileTextProps {
    className?: string;
}

const IconFileText: FC<IconFileTextProps> = ({ className }) => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path
                d="M17 2H7C5.89543 2 5 2.89543 5 4V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V4C19 2.89543 18.1046 2 hide7 2H17Z"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path d="M9 7H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M9 12H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M9 17H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
};

export default IconFileText;
