import React from 'react';

export type IconName =
    | 'ArrowRight'
    | 'ChevronRight'
    | 'ChevronDown'
    | 'Activity'
    | 'Layers'
    | 'AlertCircle'
    | 'Clock'
    | 'X'
    | 'Lock'
    | 'Eye'
    | 'EyeOff'
    | 'Trash'
    | 'Rocket'
    | 'Box'
    | 'Globe'
    | 'Target'
    | 'Zap'
    | 'Users'
    | 'HelpCircle'
    | 'Lightbulb'
    | 'FileText'
    | 'AlertTriangle'
    | 'Info'
    | 'Edit'
    | 'ExternalLink'
    | 'Menu'
    | 'Calendar'
    | 'Settings'
    | 'Copy'
    | 'RefreshCw'
    | 'Search'
    | 'Check'
    | 'Key'
    | 'Hash'
    | 'Plus'
    | 'Folder'
    | 'Trash2'
    | 'MessageSquare'
    | 'Database'
    | 'LogOut'
    | 'MousePointer'
    | 'Shield'
    | 'Mail'
    | 'User'
    | 'Flag'
    | 'CreditCard'
    | 'Book'
    | 'Save'
    | 'PlusCircle';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    name: IconName;
    size?: number | string;
    color?: string;
    className?: string;
    strokeWidth?: number;
}

export const Icon: React.FC<IconProps> = ({
    name,
    size = 24,
    color = 'currentColor',
    className = '',
    strokeWidth = 2,
    ...props
}) => {
    const icons: Record<IconName, React.ReactNode> = {
        ArrowRight: (
            <>
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
            </>
        ),
        ChevronRight: <path d="m9 5 7 7-7 7" />,
        ChevronDown: <path d="m6 9 6 6 6-6" />,
        Activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
        Layers: (
            <>
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
            </>
        ),
        AlertCircle: (
            <>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
            </>
        ),
        Clock: (
            <>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </>
        ),
        X: (
            <>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
            </>
        ),
        Lock: (
            <>
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </>
        ),
        Eye: (
            <>
                <path d="M2.062 12.349a12.24 12.24 0 0 1 0-0.698 12.24 12.24 0 0 1 19.876 0c.113.111.238.239.362.349a12.24 12.24 0 0 1-19.876 0Z" />
                <circle cx="12" cy="12" r="3" />
            </>
        ),
        EyeOff: (
            <>
                <path d="M9.88 9.88 3 3" />
                <path d="M2 12s3-7 10-7a10 10 0 0 1 5 1.43" />
                <path d="m16.62 16.62 4.38 4.38" />
                <path d="M19 12s-3 7-10 7a10 10 0 0 1-5-1.43" />
                <circle cx="12" cy="12" r="3" />
                <path d="m14.12 14.12 4.38 4.38" />
            </>
        ),
        Trash2: (
            <>
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
            </>
        ),
        Trash: (
            <>
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" x2="10" y1="11" y2="17" />
                <line x1="14" x2="14" y1="11" y2="17" />
            </>
        ),
        Rocket: (
            <>
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4.5c1.62-1.63 5-2.5 5-2.5" />
                <path d="M12 15v5s3.03-.55 4.5-2c1.63-1.62 2.5-5 2.5-5" />
            </>
        ),
        Box: (
            <>
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
            </>
        ),
        Globe: (
            <>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
            </>
        ),
        Target: (
            <>
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
            </>
        ),
        Zap: <path d="M4 14.899 15.223 3 13.825 10.101H20l-11.223 11.899L10.175 14.899H4z" />,
        Users: (
            <>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </>
        ),
        HelpCircle: (
            <>
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
            </>
        ),
        Lightbulb: (
            <>
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                <path d="M9 18h6" />
                <path d="M10 22h4" />
            </>
        ),
        FileText: (
            <>
                <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
                <path d="M15 3v6h6" />
            </>
        ),
        AlertTriangle: (
            <>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </>
        ),
        Info: (
            <>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
            </>
        ),
        Edit: (
            <>
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
            </>
        ),
        ExternalLink: (
            <>
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            </>
        ),
        Menu: (
            <>
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
            </>
        ),
        Calendar: (
            <>
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
            </>
        ),
        Settings: (
            <>
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
            </>
        ),
        Copy: (
            <>
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </>
        ),
        RefreshCw: (
            <>
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
            </>
        ),
        Search: (
            <>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
            </>
        ),
        Check: <path d="M20 6 9 17l-5-5" />,
        Key: (
            <>
                <path d="m21 2-8.3 8.3" />
                <path d="m18 8 2 2" />
                <path d="m14.5 4.5 2 2" />
                <circle cx="10" cy="14" r="6" />
            </>
        ),
        Hash: (
            <>
                <line x1="4" x2="20" y1="9" y2="9" />
                <line x1="4" x2="20" y1="15" y2="15" />
                <line x1="10" x2="8" y1="3" y2="21" />
                <line x1="16" x2="14" y1="3" y2="21" />
            </>
        ),
        Plus: (
            <>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
            </>
        ),
        Folder: (
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
        ),
        MessageSquare: (
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        ),
        Database: (
            <>
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M3 5V19A9 3 0 0 0 21 19V5" />
                <path d="M3 12A9 3 0 0 0 21 12" />
            </>
        ),
        LogOut: (
            <>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
            </>
        ),
        MousePointer: (
            <>
                <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                <path d="m13 13 6 6" />
            </>
        ),
        Shield: (
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        ),
        Mail: (
            <>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
            </>
        ),
        User: (
            <>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </>
        ),
        Flag: (
            <>
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
            </>
        ),
        CreditCard: (
            <>
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
            </>
        ),
        Book: (
            <>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </>
        ),
        Save: (
            <>
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
            </>
        ),
        PlusCircle: (
            <>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
            </>
        ),
    };

    const iconContent = icons[name];

    if (!iconContent) {
        return null;
    }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            data-testid={`icon-${name}`}
            {...props}
        >
            {iconContent}
        </svg>
    );
};
