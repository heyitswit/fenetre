import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "svelte-sonner";
import { getLocale } from "$lib/paraglide/runtime";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

function resolveLocale(locale?: string): string {
	return locale ?? getLocale()
}

export function formatDate(iso: string | Date, locale?: string) {
	return new Date(iso).toLocaleDateString(resolveLocale(locale), { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(iso: string | Date, locale?: string) {
	return new Date(iso).toLocaleTimeString(resolveLocale(locale), { hour: '2-digit', minute: '2-digit' });
}

export function formatDayLabel(iso: string | Date, locale?: string) {
	return new Date(iso).toLocaleDateString(resolveLocale(locale), { weekday: 'long', day: 'numeric', month: 'long' });
}

// Returns the localized weekday name for a given dayOfWeek (0=Sun … 6=Sat)
export function getDayName(dayOfWeek: number, locale?: string) {
	const date = new Date(2024, 0, 7 + dayOfWeek); // Jan 7 2024 = Sunday
	return date.toLocaleDateString(resolveLocale(locale), { weekday: 'long' });
}

/**
 * Parses a remote validation error and fires the appropriate toast.
 * Pass a `fields` map to override the message for specific field paths.
 * Falls back to `fallback` for unknown errors.
 *
 * Usage:
 *   toastRemoteError(err, m['booking.error.generic'](), {
 *     clientEmail: m['booking.error.invalid_email'](),
 *     clientName:  m['booking.error.name_required'](),
 *   })
 */
export function toastRemoteError(
	err: unknown,
	fallback: string,
	fields: Record<string, string> = {}
) {
	const msg = err instanceof Error ? err.message : ''
	const match = msg.match(/Remote function schema validation failed: (\[.+\])/)
	if (match) {
		try {
			const issues: { path: string[] }[] = JSON.parse(match[1])
			const path = issues[0]?.path ?? []
			for (const field of path) {
				if (fields[field]) {
					toast.error(fields[field])
					return
				}
			}
		} catch { /* ignore */ }
	}
	toast.error(fallback)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
