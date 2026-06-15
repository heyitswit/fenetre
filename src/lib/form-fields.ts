export type FormFieldType = 'text' | 'textarea' | 'radio' | 'select'

export interface FormFieldOption {
	value: string
	label: string
}

export interface FormField {
	key: string
	label: string
	type: FormFieldType
	options?: FormFieldOption[]
	required?: boolean
	enabled: boolean
	placeholder?: string
}

export const BUILT_IN_KEYS = [
	'companyName',
	'projectDescription',
	'stack',
	'missionType',
	'budget',
	'urgency',
	'linkedin'
] as const

export type BuiltInKey = (typeof BUILT_IN_KEYS)[number]

export const DEFAULT_FORM_FIELDS: FormField[] = [
	{
		key: 'companyName',
		label: 'Nom de la société',
		type: 'text',
		enabled: true,
		placeholder: 'Acme SAS, BNP Paribas...'
	},
	{
		key: 'projectDescription',
		label: 'Décrivez votre projet',
		type: 'textarea',
		required: true,
		enabled: true,
		placeholder: 'Contexte, objectifs, contraintes...'
	},
	{
		key: 'stack',
		label: 'Votre stack actuelle',
		type: 'text',
		enabled: true,
		placeholder: 'React, Laravel, Node...'
	},
	{
		key: 'missionType',
		label: 'Type de mission',
		type: 'radio',
		enabled: true,
		options: [
			{ value: 'courte', label: 'Mission courte (< 1 mois)' },
			{ value: 'longue', label: 'Mission longue (TJM)' },
			{ value: 'conseil', label: 'Conseil / audit ponctuel' }
		]
	},
	{
		key: 'budget',
		label: 'Budget indicatif',
		type: 'text',
		enabled: true,
		placeholder: 'ex: 5-10k€, TJM 500€...'
	},
	{
		key: 'urgency',
		label: 'Urgence',
		type: 'radio',
		enabled: true,
		options: [
			{ value: 'normal', label: 'Normal' },
			{ value: 'urgent', label: "Urgent (j'ai besoin de quelqu'un rapidement)" }
		]
	},
	{
		key: 'linkedin',
		label: 'LinkedIn ou site',
		type: 'text',
		enabled: true,
		placeholder: 'https://linkedin.com/in/...'
	}
]

export function getEnabledFields(formFields: FormField[] | null | undefined): FormField[] {
	if (!formFields || formFields.length === 0) {
		return DEFAULT_FORM_FIELDS.filter((f) => f.enabled)
	}
	return formFields.filter((f) => f.enabled)
}

export function deepCopyFields(fields: FormField[]): FormField[] {
	return fields.map((f) => ({
		...f,
		options: f.options?.map((o) => ({ ...o }))
	}))
}
