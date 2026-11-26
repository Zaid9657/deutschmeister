// Keyboard-independent digits, shared by practice, final checks and writing.
export const westernDigits = (s) => String(s ?? '').replace(/[٠-٩۰-۹]/g, (d) => String(d.charCodeAt(0) & 0xf));
