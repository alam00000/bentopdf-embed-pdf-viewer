import { h } from 'preact';
import { IconProps } from './types';

export const CloudIcon = ({
  size = 24,
  strokeWidth = 2,
  primaryColor = 'currentColor',
  secondaryColor = 'none',
  className,
  title,
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={secondaryColor}
    stroke={primaryColor}
    stroke-width={strokeWidth}
    stroke-linecap="round"
    stroke-linejoin="round"
    class={className}
    role="img"
    aria-label={title}
  >
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </svg>
);
