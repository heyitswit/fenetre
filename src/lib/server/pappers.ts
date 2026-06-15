import { env } from '$lib/server/env';

export interface PappersData {
	company: string | null;
	companySiren: string | null;
	companySector: string | null;
	companySize: string | null;
}

interface PappersSearchResult {
	siren: string;
	nom_entreprise: string;
}

interface PappersCompany {
	nom_entreprise?: string;
	libelle_activite_principale?: string;
	tranche_effectif?: string;
}

export async function fetchPappersData(
	companyName: string,
	siren?: string
): Promise<PappersData | null> {
	const apiKey = env.PAPPERS_API_KEY;
	if (!apiKey) return null;

	let resolvedSiren = siren;
	let resolvedName = companyName;

	if (!resolvedSiren && companyName) {
		const searchRes = await fetch(
			`https://api.pappers.fr/v2/recherche?q=${encodeURIComponent(companyName)}&api_token=${apiKey}&par_page=1`
		);
		if (!searchRes.ok) return null;
		const searchData = await searchRes.json();
		const top: PappersSearchResult | undefined = searchData.resultats?.[0];
		if (!top?.siren) return null;
		resolvedSiren = top.siren;
		resolvedName = top.nom_entreprise ?? companyName;
	}

	if (!resolvedSiren) return null;

	const detailRes = await fetch(
		`https://api.pappers.fr/v2/entreprise?siren=${resolvedSiren}&api_token=${apiKey}`
	);
	if (!detailRes.ok) return null;

	const company: PappersCompany = await detailRes.json();

	return {
		company: company.nom_entreprise ?? resolvedName,
		companySiren: resolvedSiren,
		companySector: company.libelle_activite_principale ?? null,
		companySize: company.tranche_effectif ?? null
	};
}
