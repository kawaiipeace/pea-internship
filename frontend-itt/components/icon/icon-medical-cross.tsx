import { FC } from 'react';

interface IconMedicalCrossProps {
    className?: string;
}

const IconMedicalCross: FC<IconMedicalCrossProps> = ({ className }) => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path
                d="M9 4V9H4V15H9V20H15V15H20V9H15V4H9Z"
                fill="currentColor"
            />
        </svg>
    );
};

export default IconMedicalCross;
