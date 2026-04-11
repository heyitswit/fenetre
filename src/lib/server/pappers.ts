import { db } from '$lib/server/db';
import { prospectInsights } from '$lib/server/db/schema';
import { env } from '$lib/server/env';

interface PappersSearchResult {
	siren: string;
	nom_entreprise: string;
}

interface PappersCompany {
	nom_entreprise?: string;
	libelle_activite_principale?: string;
	tranche_effectif?: string;
}

export async function enrichFromPappers(companyName: string, bookingId: string): Promise<void> {
	const apiKey = env.PAPPERS_API_KEY;
	if (!apiKey) return;

	const searchRes = await fetch(
		`https://api.pappers.fr/v2/recherche?q=${encodeURIComponent(companyName)}&api_token=${apiKey}&par_page=1`
	);
	if (!searchRes.ok) return;

	const searchData = await searchRes.json();
	const top: PappersSearchResult | undefined = searchData.resultats?.[0];
	if (!top?.siren) return;

	const detailRes = await fetch(
		`https://api.pappers.fr/v2/entreprise?siren=${top.siren}&api_token=${apiKey}`
	);
	if (!detailRes.ok) return;

	const company: PappersCompany = await detailRes.json();

	await db.insert(prospectInsights).values({
		bookingId,
		company: company.nom_entreprise ?? top.nom_entreprise,
		companySector: company.libelle_activite_principale ?? null,
		companySize: company.tranche_effectif ?? null
	});
}
