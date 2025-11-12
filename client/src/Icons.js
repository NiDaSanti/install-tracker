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

export function WarningIcon({ size = 48, color = 'currentColor', className }) {
  return (
    <SvgIcon size={size} color={color} strokeWidth={1.5} className={className}>
      <path d="M11.1 4.8 2.6 19.3a1.7 1.7 0 0 0 1.5 2.6h15.8a1.7 1.7 0 0 0 1.5-2.6L12.9 4.8a1.7 1.7 0 0 0-1.8 0Z" />
      <path d="M12 9.2v5.4" />
      <circle cx="12" cy="18.1" r="0.9" fill={color} stroke="none" />
    </SvgIcon>
  );
}