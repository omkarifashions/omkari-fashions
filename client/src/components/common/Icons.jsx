const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const Svg = ({ size = 24, children, ...p }) => <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...p}>{children}</svg>;

export const SearchIcon = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>;
export const UserIcon = (p) => <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></Svg>;
export const HeartIcon = ({ filled, ...p }) => <Svg {...p} fill={filled ? 'currentColor' : 'none'}><path d="M12 20.5s-8-4.9-8-11A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5c0 6.1-8 11-8 11z" /></Svg>;
export const CartIcon = (p) => <Svg {...p}><path d="M3 4h2.5l2.2 10.5h10.6L20.5 8H6.3" /><circle cx="9" cy="19" r="1.3" /><circle cx="17" cy="19" r="1.3" /></Svg>;
export const TrashIcon = (p) => <Svg {...p}><path d="M4 7h16M9 7V4h6v3M6.5 7l.8 13h9.4l.8-13M10 11v6M14 11v6" /></Svg>;
export const ChevronDown = (p) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
export const ChevronRight = (p) => <Svg {...p}><path d="m9 6 6 6-6 6" /></Svg>;
export const ChevronLeft = (p) => <Svg {...p}><path d="m15 6-6 6 6 6" /></Svg>;
export const MenuIcon = (p) => <Svg {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Svg>;
export const CloseIcon = (p) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const ArrowRight = (p) => <Svg {...p}><path d="M4 12h16m-5-5 5 5-5 5" /></Svg>;
export const FilterIcon = (p) => <Svg {...p}><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></Svg>;
export const SortIcon = (p) => <Svg {...p}><path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3" /></Svg>;
export const PhoneIcon = (p) => <Svg {...p} fill="currentColor" stroke="none"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11 11 0 0 0 3.5.56 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.2.2 2.400.56 3.500a1 1 0 0 1-.25 1z" /></Svg>;
export const MailIcon = (p) => <Svg {...p} fill="currentColor" stroke="none"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1.4 2L12 12.6 19.600 7zM4 9v8h16V9l-8 5.500z" /></Svg>;
export const CheckIcon = (p) => <Svg {...p}><path d="m5 12.5 4.500 4.500L19 7.500" /></Svg>;
export const StarIcon = (p) => <Svg {...p} fill="currentColor" stroke="none"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.800 5.800 21l1.200-6.800-5-4.900 6.900-1z" /></Svg>;
export const UploadIcon = (p) => <Svg {...p}><path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></Svg>;
export const EyeIcon = ({ off, ...p }) => <Svg {...p}><path d="M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />{off && <path d="M4 4l16 16" />}</Svg>;

const brandProps = { fill: 'currentColor', stroke: 'none' };
export const FacebookIcon = (p) => <Svg {...p} {...brandProps}><path d="M13.500 21v-7.500h2.500l.5-3h-3V8.600c0-.9.300-1.500 1.600-1.500H16.700V4.400C16.400 4.400 15.500 4.300 14.500 4.300c-2.300 0-3.900 1.400-3.900 4v2.200H8v3h2.600V21z" /></Svg>;
export const PinterestIcon = (p) => <Svg {...p} {...brandProps}><path d="M12 2a10 10 0 0 0-3.600 19.300c-.1-.8-.2-2 0-2.900l1.200-5s-.3-.6-.3-1.500c0-1.400.8-2.400 1.800-2.400.9 0 1.300.6 1.300 1.400 0 .9-.6 2.100-.8 3.300-.2 1 .5 1.800 1.500 1.800 1.800 0 3.200-1.900 3.200-4.600 0-2.400-1.700-4.100-4.200-4.100-2.900 0-4.600 2.200-4.600 4.400 0 .9.300 1.800.8 2.300.1.100.1.200.1.300l-.3 1.200c0 .2-.2.200-.4.100-1.300-.6-2.100-2.500-2.100-4 0-3.300 2.400-6.400 6.900-6.400 3.600 0 6.400 2.600 6.400 6 0 3.600-2.300 6.500-5.400 6.500-1.100 0-2.100-.5-2.400-1.200l-.7 2.500c-.2.900-.9 2-1.300 2.700A10 10 0 1 0 12 2z" /></Svg>;
export const InstagramIcon = (p) => <Svg {...p}><rect x="3.500" y="3.500" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.200" cy="6.800" r=".8" fill="currentColor" /></Svg>;
export const YoutubeIcon = (p) => <Svg {...p} {...brandProps}><path d="M21.600 7.200a2.500 2.500 0 0 0-1.800-1.800C18.200 5 12 5 12 5s-6.200 0-7.800.4A2.500 2.500 0 0 0 2.400 7.200C2 8.800 2 12 2 12s0 3.200.4 4.800a2.500 2.500 0 0 0 1.800 1.800C5.800 19 12 19 12 19s6.200 0 7.800-.4a2.500 2.500 0 0 0 1.800-1.800C22 15.200 22 12 22 12s0-3.200-.4-4.800zM10 15V9l5.200 3z" /></Svg>;
