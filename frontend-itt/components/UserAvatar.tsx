import React from 'react';
import ImageWithAuth from './ImageWithAuth';

interface UserAvatarProps {
    user?: any;
    name?: string;
    roleId?: number;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, name, roleId: propRoleId, className = '', size = 'md' }) => {
    const roleId = propRoleId ?? user?.roleId;
    const fullName = name ?? (user ? [user.fname, user.lname].filter(Boolean).join(' ') : 'Guest');
    const initials = (fullName || 'G').charAt(0).toUpperCase();

    // Size mappings
    const sizeClasses = {
        sm: 'h-9 w-9 text-base',
        md: 'h-10 w-10 text-lg',
        lg: 'h-12 w-12 text-xl',
        xl: 'h-16 w-16 text-2xl',
    };

    const selectedSizeClass = sizeClasses[size] || sizeClasses.md;
    const isRoundedOverridden = className.includes('rounded-');

    // For Interns (roleId === 3), we use ImageWithAuth if user.id is available
    if (roleId === 3 && (user?.id || user?.userId)) {
        return (
            <ImageWithAuth 
                userId={user?.id || user?.userId} 
                className={`${selectedSizeClass} ${isRoundedOverridden ? '' : 'rounded-full'} object-cover ${className}`} 
            />
        );
    }

    // For Mentors (roleId === 2) and Admins (roleId === 1), or fallback, we use Initials
    // Swapped colors: Bg is #9A0D8A, Text is #FDF2FD
    return (
        <div 
            className={`${selectedSizeClass} flex items-center justify-center ${isRoundedOverridden ? '' : 'rounded-full'} bg-[#9A0D8A] text-[#FDF2FD] font-bold border border-[#9A0D8A] shrink-0 ${className}`}
            title={fullName}
        >
            {initials}
        </div>
    );
};

export default UserAvatar;
