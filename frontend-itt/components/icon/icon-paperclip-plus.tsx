import { FC } from 'react';

interface IconPaperclipPlusProps {
    className?: string;
}

const IconPaperclipPlus: FC<IconPaperclipPlusProps> = ({ className }) => {
    return (
        <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className={className}
        >
            <path 
                d="M13 14.5V6H11V14.5C11 15.33 11.67 16 12.5 16C13.33 16 14 15.33 14 14.5V5C14 3.34 12.66 2 11 2C9.34 2 8 3.34 8 5V15.5C8 17.98 10.02 20 12.5 20C14.98 20 17 17.98 17 15.5V6H15V15.5C15 16.88 13.88 18 12.5 18C11.12 18 10 16.88 10 15.5V5C10 4.45 10.45 4 11 4C11.55 4 12 4.45 12 5V14.5H13Z" 
                fill="currentColor"
            />
            <path 
                d="M21 6H19V4H17V6H15V8H17V10H19V8H21V6Z" 
                fill="currentColor"
            />
        </svg>
    );
};

export default IconPaperclipPlus;
