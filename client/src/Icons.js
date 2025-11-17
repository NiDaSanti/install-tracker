import React from 'react';

function SvgIcon({ size = 20, color = 'currentColor', strokeWidth = 1.7, className, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="presentation"
      {...props}
    >
      {children}
    </svg>
  );
}

export function LogoIcon({ size = 28, color = 'currentColor', className }) {
  return (
    <SvgIcon size={size} color={color} strokeWidth={1.6} className={className}>
      <path d="M4.5 11.2 12 5l7.5 6.2v8.3a1.8 1.8 0 0 1-1.8 1.8H6.3a1.8 1.8 0 0 1-1.8-1.8z" />
      <path d="M9 21v-5.2a1.8 1.8 0 0 1 1.8-1.8h2.4A1.8 1.8 0 0 1 15 15.8V21" />
      <path d="M9.4 13.2 12 15.8l4-4" />
      <path d="M2.5 11.5 12 4l9.5 7.5" />
    </SvgIcon>
  );
}

export function AddIcon({ size = 18, color = 'currentColor', className }) {
  return (
    <SvgIcon size={size} color={color} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </SvgIcon>
  );
}

export function ListIcon({ size = 18, color = 'currentColor', className }) {
  return (
    <SvgIcon size={size} color={color} className={className}>
      <path d="M6.5 7h11" />
      <path d="M6.5 12h11" />
      <path d="M6.5 17h11" />
      <circle cx="4" cy="7" r="0.9" />
      <circle cx="4" cy="12" r="0.9" />
      <circle cx="4" cy="17" r="0.9" />
    </SvgIcon>
  );
}

export function MapIcon({ size = 18, color = 'currentColor', className }) {
  return (
    <SvgIcon size={size} color={color} className={className}>
      <path d="M9 4.5 4.5 6.5v13l4.5-2 6 2 4.5-2v-13l-4.5 2z" />
      <path d="m9 4.5 6 2v13" />
      <path d="m9 9.5 6 2" />
    </SvgIcon>
  );
}

export function UploadIcon({ size = 18, color = 'currentColor', className }) {
  return (
    <SvgIcon size={size} color={color} className={className}>
      <path d="M12 20v-7" />
      <path d="m9 11 3-3 3 3" />
      <path d="M5 14v5h14v-5" />
    </SvgIcon>
  );
}

export function ExpandIcon({ size = 18, color = 'currentColor', className }) {
  return (
    <SvgIcon size={size} color={color} className={className}>
      <path d="M9 4H4v5" />
      <path d="m4 4 5 5" />
      <path d="M15 4h5v5" />
      <path d="m20 4-5 5" />
      <path d="M9 20H4v-5" />
      <path d="m4 20 5-5" />
      <path d="M15 20h5v-5" />
      <path d="m20 20-5-5" />
    </SvgIcon>
  );
}

export function SunIcon({ size = 18, color = 'currentColor', className }) {
  return (
    <SvgIcon size={size} color={color} className={className}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 3v2.4" />
      <path d="M12 18.6V21" />
      <path d="m4.7 4.7 1.7 1.7" />
      <path d="m17.6 17.6 1.7 1.7" />
      <path d="M3 12h2.4" />
      <path d="M18.6 12H21" />
      <path d="m4.7 19.3 1.7-1.7" />
      <path d="m17.6 6.4 1.7-1.7" />
    </SvgIcon>
  );
}

export function MoonIcon({ size = 18, color = 'currentColor', className }) {
  return (
    <SvgIcon size={size} color={color} className={className}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a6.5 6.5 0 1 0 8.5 8.5Z" />
    </SvgIcon>
  );
}

export function LogoutIcon({ size = 18, color = 'currentColor', className }) {
  return (
    <SvgIcon size={size} color={color} className={className}>
      <path d="M15.5 7.5 20 12l-4.5 4.5" />
      <path d="M9.5 12H20" />
      <path d="M13.5 20H6.3A2.3 2.3 0 0 1 4 17.7V6.3A2.3 2.3 0 0 1 6.3 4H13.5" />
    </SvgIcon>
  );
}

export function CloseIcon({ size = 18, color = 'currentColor', className }) {
  return (
    <SvgIcon size={size} color={color} className={className}>
      <path d="m7 7 10 10" />
      <path d="m17 7-10 10" />
    </SvgIcon>
  );
}

export function WarningIcon({ size = 48, color = 'currentColor', className }) {
  return (
    <SvgIcon size={size} color={color} strokeWidth={1.5} className={className}>
      <path d="M11.1 4.8 2.6 19.3a1.7 1.7 0 0 0 1.5 2.6h15.8a1.7 1.7 0 0 0 1.5-2.6L12.9 4.8a1.7 1.7 0 0 0-1.8 0Z" />
      <path d="M12 9.2v5.4" />
      <circle cx="12" cy="18.1" r="0.9" fill={color} stroke="none" />
    </SvgIcon>
  );
}

export function LocationIcon({ size = 18, color = 'currentColor', className }) {
  return (
    <SvgIcon size={size} color={color} className={className}>
      <path d="M12 21.2s6-6.3 6-10.2a6 6 0 1 0-12 0c0 3.9 6 10.2 6 10.2Z" />
      <circle cx="12" cy="11" r="2.3" />
    </SvgIcon>
  );
}

export function PowerIcon({ size = 20, color = 'currentColor', className }) {
  return (
    <SvgIcon size={size} color={color} className={className}>
      <path d="M12 2v7" />
      <path d="M7.4 5.5a8 8 0 1 0 9.2 0" />
    </SvgIcon>
  );
}

export function CalendarIcon({ size = 18, color = 'currentColor', className }) {
  return (
    <SvgIcon size={size} color={color} className={className}>
      <rect x="3.2" y="5" width="17.6" height="15.5" rx="2" />
      <path d="M3.2 9.2h17.6" />
      <path d="M8.5 3.3v3.4" />
      <path d="M15.5 3.3v3.4" />
    </SvgIcon>
  );
}

export function NoteIcon({ size = 18, color = 'currentColor', className }) {
  return (
    <SvgIcon size={size} color={color} className={className}>
      <path d="M6 4.5h12a1.8 1.8 0 0 1 1.8 1.8v11.4L15.2 21H6a1.8 1.8 0 0 1-1.8-1.8V6.3A1.8 1.8 0 0 1 6 4.5Z" />
      <path d="M14.8 20.6v-3.6a1.8 1.8 0 0 1 1.8-1.8h3.6" />
      <path d="M8.4 9.4h7.2" />
      <path d="M8.4 13h4.5" />
    </SvgIcon>
  );
}

export function EditIcon({ size = 16, color = 'currentColor', className }) {
  return (
    <SvgIcon size={size} color={color} className={className}>
      <path d="M4 16.9 4.7 13l8.9-8.9a1.8 1.8 0 0 1 2.6 0l2.7 2.7a1.8 1.8 0 0 1 0 2.6L10 18.3z" />
      <path d="M13.3 5.6 18.4 10.7" />
    </SvgIcon>
  );
}

export function TrashIcon({ size = 16, color = 'currentColor', className }) {
  return (
    <SvgIcon size={size} color={color} className={className}>
      <path d="M5.5 6.8h13" />
      <path d="M9 6.8v-2a1.2 1.2 0 0 1 1.2-1.2h3.6A1.2 1.2 0 0 1 15 4.8v2" />
      <path d="M7.8 6.8 8.5 20a1.3 1.3 0 0 0 1.3 1.2h6.4a1.3 1.3 0 0 0 1.3-1.2l0.7-13.2" />
      <path d="m10.6 11.6.3 5.8" />
      <path d="m14.6 11.6-.3 5.8" />
    </SvgIcon>
  );
}