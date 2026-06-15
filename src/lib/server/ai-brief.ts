import OpenAI from 'openai';
import { env } from '$lib/server/env';
import type { PappersData } from '$lib/server/pappers';

interface BriefData {
	projectDescription: string | null;
	stack: string | null;
	missionType: string | null;
	budget: string | null;
	urgency: string | null;
}

export interface AiBriefResult {
	aiBrief: string;
	aiAngles: string[];
	aiOpeningQuestion: string;
	compatibilityScore: number;
}

export async function generateAiBrief(
	brief: BriefData | null,
	company: PappersData | null
): Promise<AiBriefResult | null> {
	if (!env.OPENAI_API_KEY) return null;
	if (!brief?.projectDescription && !company?.company) return null;

	const client = new OpenAI({
		apiKey: env.OPENAI_API_KEY,
		baseURL: env.OPENAI_URL
	});

	const prompt = `Tu es l'assistante d'une développeuse freelance.
Voici les informations sur un prospect qui vient de réserver un call :

Brief prospect :
- Projet : ${brief?.projectDescription ?? 'Non renseigné'}
- Stack actuelle : ${brief?.stack ?? 'Non renseigné'}
- Type de mission : ${brief?.missionType ?? 'Non renseigné'}
- Budget indicatif : ${brief?.budget ?? 'Non renseigné'}
- Urgence : ${brief?.urgency ?? 'normal'}

Entreprise :
- Nom : ${company?.company ?? 'Inconnu'}
- Secteur : ${company?.companySector ?? 'Inconnu'}
- Taille : ${company?.companySize ?? 'Inconnue'}

Génère une réponse JSON avec exactement ces clés :
{
  "brief": "Résumé en 3-4 lignes du contexte. Factuel, direct, mets en avant ce qui est concret et intéressant.",
  "angles": ["Angle 1 de mission concret", "Angle 2", "Angle 3 optionnel"],
  "openingQuestion": "Une seule question directe et pertinente pour ouvrir le call.",
  "score": 75
}

Le score (0-100) évalue l'attractivité de la mission : budget mentionné et raisonnable (+30), stack bien définie (+25), mission claire (+25), urgence compatible (+20). Déduis des points si des infos clés manquent.
Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

	const response = await client.chat.completions.create({
		model: env.OPENAI_MODEL ?? 'gpt-4o-mini',
		messages: [{ role: 'user', content: prompt }],
		response_format: { type: 'json_object' },
		temperature: 0.3
	});

	const raw = response.choices[0].message.content;
	if (!raw) return null;

	const data = JSON.parse(raw);
	return {
		aiBrief: data.brief ?? '',
		aiAngles: Array.isArray(data.angles) ? data.angles : [],
		aiOpeningQuestion: data.openingQuestion ?? '',
		compatibilityScore: typeof data.score === 'number' ? Math.min(100, Math.max(0, data.score)) : 0
	};
}
