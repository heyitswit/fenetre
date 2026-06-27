import * as m from '$lib/paraglide/messages';
import type { Locale } from '$lib/paraglide/runtime';

// Calendar event `location` shown before the client's number is revealed
export function phoneCallPlaceholder(locale: Locale): string {
	return m['calendar.location.phone_placeholder']({}, { locale });
}

// Calendar event `location` once the number is revealed (~30 min before the call)
export function phoneCallLocation(phone: string, locale: Locale): string {
	return m['calendar.location.phone_revealed']({ phone }, { locale });
}
