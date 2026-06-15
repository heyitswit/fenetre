import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface PappersSuggestion {
	siren: string;
	nom_entreprise: string;
	siege?: { ville?: string };
}

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim();
	if (!q || q.length < 2) return json([]);

	try {
		const res = await fetch(
			`https://suggestions.pappers.fr/v2?q=${encodeURIComponent(q)}&cibles=nom_entreprise&nb_resultats=6`,
			{ signal: AbortSignal.timeout(3000) }
		);
		if (!res.ok) return json([]);
		const data = await res.json();
		return json(
			(data.resultats_nom_entreprise ?? []).map((r: PappersSuggestion) => ({
				siren: r.siren,
				nom: r.nom_entreprise,
				ville: r.siege?.ville
			}))
		);
	} catch {
		return json([]);
	}
};
