// All IANA timezones, read natively from the runtime — no hardcoded list to maintain.
export function listTimezones(): string[] {
	const supported = (Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] })
		.supportedValuesOf;
	return supported ? supported('timeZone') : ['Europe/Paris', 'UTC'];
}

// Accept any zone the runtime recognizes rather than checking against a fixed list
export function isValidTimezone(tz: string): boolean {
	try {
		new Intl.DateTimeFormat('en', { timeZone: tz });
		return true;
	} catch {
		return false;
	}
}
