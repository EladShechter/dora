import {
	GeometryDesign,
	PolygonDesign,
	LineDesign,
	PointDesign,
} from './NewGeometryDesign';

export type GeometryType = 'point' | 'line' | 'polygon';

type GeometryDesignKey = keyof GeometryDesign;
type GeometryDesignValue = GeometryDesign[GeometryDesignKey];

interface FieldConfig {
	baseField?: GeometryDesignKey;
	condition?: (design: Partial<GeometryDesign>, prefix: string) => boolean;
	format?: (value: GeometryDesignValue, design: Partial<GeometryDesign>, prefix: string) => GeometryDesignValue;
}

type UnprefixedKey = string;
type FieldConfigMap = Record<UnprefixedKey, FieldConfig>;

const SIZE_VALUES: Record<string, number> = {
	small: 8,
	medium: 12,
	large: 16,
};

function formatSize(value: unknown): number | undefined {
	if (typeof value === 'number') {
		return value;
	}
	if (typeof value === 'string' && value in SIZE_VALUES) {
		return SIZE_VALUES[value];
	}
	return undefined;
}

function formatColorWithOpacity(
	colorValue: unknown,
	opacityValue: unknown
): string | undefined {
	if (typeof colorValue !== 'string') {
		return undefined;
	}

	if (typeof opacityValue !== 'number') {
		return colorValue;
	}

	const parsed = parseColor(colorValue);
	if (!parsed) {
		return colorValue;
	}

	parsed.a = Math.max(0, Math.min(1, opacityValue));
	return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${parsed.a})`;
}

interface ParsedColor {
	r: number;
	g: number;
	b: number;
	a: number;
}

function parseColor(color: string): ParsedColor | null {
	const trimmed = color.trim().toLowerCase();

	if (trimmed.startsWith('#')) {
		return parseHexColor(trimmed);
	}

	if (trimmed.startsWith('rgb')) {
		return parseRgbColor(trimmed);
	}

	return parseNamedColor(trimmed);
}

function parseHexColor(hex: string): ParsedColor | null {
	const cleaned = hex.slice(1);
	let r: number, g: number, b: number, a = 1;

	if (cleaned.length === 3) {
		r = parseInt(cleaned[0] + cleaned[0], 16);
		g = parseInt(cleaned[1] + cleaned[1], 16);
		b = parseInt(cleaned[2] + cleaned[2], 16);
	} else if (cleaned.length === 6) {
		r = parseInt(cleaned.slice(0, 2), 16);
		g = parseInt(cleaned.slice(2, 4), 16);
		b = parseInt(cleaned.slice(4, 6), 16);
	} else if (cleaned.length === 8) {
		r = parseInt(cleaned.slice(0, 2), 16);
		g = parseInt(cleaned.slice(2, 4), 16);
		b = parseInt(cleaned.slice(4, 6), 16);
		a = parseInt(cleaned.slice(6, 8), 16) / 255;
	} else {
		return null;
	}

	return { r, g, b, a };
}

function parseRgbColor(rgb: string): ParsedColor | null {
	const match = rgb.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
	if (!match) {
		return null;
	}

	return {
		r: parseInt(match[1], 10),
		g: parseInt(match[2], 10),
		b: parseInt(match[3], 10),
		a: match[4] !== undefined ? parseFloat(match[4]) : 1,
	};
}

function parseNamedColor(name: string): ParsedColor | null {
	const namedColors: Record<string, ParsedColor> = {
		black: { r: 0, g: 0, b: 0, a: 1 },
		white: { r: 255, g: 255, b: 255, a: 1 },
		red: { r: 255, g: 0, b: 0, a: 1 },
		green: { r: 0, g: 128, b: 0, a: 1 },
		blue: { r: 0, g: 0, b: 255, a: 1 },
		yellow: { r: 255, g: 255, b: 0, a: 1 },
		cyan: { r: 0, g: 255, b: 255, a: 1 },
		magenta: { r: 255, g: 0, b: 255, a: 1 },
		gray: { r: 128, g: 128, b: 128, a: 1 },
		grey: { r: 128, g: 128, b: 128, a: 1 },
		orange: { r: 255, g: 165, b: 0, a: 1 },
		purple: { r: 128, g: 0, b: 128, a: 1 },
		transparent: { r: 0, g: 0, b: 0, a: 0 },
	};

	return namedColors[name] ?? null;
}

function symbolShowCondition(design: Partial<GeometryDesign>, prefix: string): boolean {
	const key = `${prefix}-symbol-show` as keyof GeometryDesign;
	const symbolShow = design[key];
	return symbolShow !== false;
}

const FIELD_CONFIG: FieldConfigMap = {
	// Symbol fields with show condition
	'symbol-type': {
		baseField: 'base-symbol-type',
		condition: symbolShowCondition,
	},
	'symbol-position': {
		condition: symbolShowCondition,
	},
	'symbol-show': {},
	'symbol-marker-size': {
		baseField: 'base-symbol-marker-size',
		condition: symbolShowCondition,
		format: (value) => formatSize(value),
	},
	'symbol-marker-color': {
		baseField: 'base-symbol-marker-color',
		condition: symbolShowCondition,
		format: (value, design, prefix) => {
			const opacityKey = `${prefix}-symbol-marker-opacity` as keyof GeometryDesign;
			return formatColorWithOpacity(value, design[opacityKey]);
		},
	},
	'symbol-marker-opacity': {
		baseField: 'base-symbol-marker-opacity',
		condition: symbolShowCondition,
	},
	'symbol-marker-outline-color': {
		baseField: 'base-symbol-marker-outline-color',
		condition: symbolShowCondition,
		format: (value, design, prefix) => {
			const opacityKey = `${prefix}-symbol-marker-outline-opacity` as keyof GeometryDesign;
			return formatColorWithOpacity(value, design[opacityKey]);
		},
	},
	'symbol-marker-outline-opacity': {
		baseField: 'base-symbol-marker-outline-opacity',
		condition: symbolShowCondition,
	},
	'symbol-marker-outline-width': {
		baseField: 'base-symbol-marker-outline-width',
		condition: symbolShowCondition,
	},
	'symbol-custom-image': {
		baseField: 'base-symbol-custom-image',
		condition: symbolShowCondition,
	},
	'symbol-custom-width': {
		baseField: 'base-symbol-custom-width',
		condition: symbolShowCondition,
		format: (value) => formatSize(value),
	},
	'symbol-custom-height': {
		baseField: 'base-symbol-custom-height',
		condition: symbolShowCondition,
		format: (value) => formatSize(value),
	},
	'symbol-custom-opacity': {
		baseField: 'base-symbol-custom-opacity',
		condition: symbolShowCondition,
	},
	'symbol-custom-angle': {
		baseField: 'base-symbol-custom-angle',
		condition: symbolShowCondition,
	},
	'symbol-custom-origin': {
		baseField: 'base-symbol-custom-origin',
		condition: symbolShowCondition,
	},

	// Label fields
	'label-text': {
		baseField: 'base-label-text',
	},
	'label-position': {
		baseField: 'base-label-position',
	},
	'label-opacity': {
		baseField: 'base-label-opacity',
	},
	'label-font-size': {
		baseField: 'base-label-font-size',
		format: (value) => formatSize(value),
	},
	'label-font-color': {
		baseField: 'base-label-font-color',
		format: (value, design, prefix) => {
			const opacityKey = `${prefix}-label-opacity` as keyof GeometryDesign;
			return formatColorWithOpacity(value, design[opacityKey]);
		},
	},
	'label-background-color': {
		baseField: 'base-label-background-color',
		format: (value, design, prefix) => {
			const opacityKey = `${prefix}-label-opacity` as keyof GeometryDesign;
			return formatColorWithOpacity(value, design[opacityKey]);
		},
	},
	'label-origin': {
		baseField: 'base-label-origin',
	},
	'label-icon-relative-position': {
		baseField: 'base-label-icon-relative-position',
	},

	// Stroke fields (line prefix)
	'color': {
		baseField: 'base-color',
		format: (value, design, prefix) => {
			const opacityKey = `${prefix}-opacity` as keyof GeometryDesign;
			return formatColorWithOpacity(value, design[opacityKey]);
		},
	},
	'opacity': {},
	'width': {},

	// Polygon specific
	'fill-color': {
		baseField: 'base-color',
		format: (value, design, prefix) => {
			const opacityKey = `${prefix}-fill-opacity` as keyof GeometryDesign;
			return formatColorWithOpacity(value, design[opacityKey]);
		},
	},
	'fill-opacity': {},
	'outline-color': {
		baseField: 'base-color',
		format: (value, design, prefix) => {
			const opacityKey = `${prefix}-outline-opacity` as keyof GeometryDesign;
			return formatColorWithOpacity(value, design[opacityKey]);
		},
	},
	'outline-opacity': {},
	'outline-width': {},
	'type': {},
};

function mergeDesigns(
	app?: Partial<GeometryDesign>,
	layer?: Partial<GeometryDesign>,
	feature?: Partial<GeometryDesign>
): Partial<GeometryDesign> {
	return {
		...(app ?? {}),
		...(layer ?? {}),
		...(feature ?? {}),
	};
}

function applyDefaultsAndFormat(
	merged: Partial<GeometryDesign>,
	geometryType: GeometryType,
	fieldConfig: FieldConfigMap
): Partial<GeometryDesign> {
	const result: Partial<GeometryDesign> = {};
	const prefix = geometryType;

	for (const [key, value] of Object.entries(merged)) {
		if (key.startsWith(`${prefix}-`) || key.startsWith('base-')) {
			(result as Record<string, GeometryDesignValue>)[key] = value;
		}
	}

	for (const [unprefixedField, config] of Object.entries(fieldConfig)) {
		const prefixedKey = `${prefix}-${unprefixedField}` as keyof GeometryDesign;

		if (result[prefixedKey] === undefined && config?.baseField) {
			const baseValue = merged[config.baseField];
			if (baseValue !== undefined) {
				(result as Record<string, GeometryDesignValue>)[prefixedKey] = baseValue;
			}
		}
	}

	for (const [unprefixedField, config] of Object.entries(fieldConfig)) {
		const prefixedKey = `${prefix}-${unprefixedField}` as keyof GeometryDesign;
		const value = result[prefixedKey];

		if (config?.condition && !config.condition(merged, prefix)) {
			(result as Record<string, GeometryDesignValue>)[prefixedKey] = undefined;
			continue;
		}

		if (config?.format && value !== undefined) {
			(result as Record<string, GeometryDesignValue>)[prefixedKey] = config.format(value, merged, prefix);
		}
	}

	for (const key of Object.keys(result)) {
		if (key.startsWith('base-')) {
			delete (result as Record<string, GeometryDesignValue>)[key];
		}
	}

	return result;
}

export function getComputedDesign(
	geometryType: 'polygon',
	app?: Partial<GeometryDesign>,
	layer?: Partial<GeometryDesign>,
	feature?: Partial<GeometryDesign>
): Partial<PolygonDesign>;
export function getComputedDesign(
	geometryType: 'line',
	app?: Partial<GeometryDesign>,
	layer?: Partial<GeometryDesign>,
	feature?: Partial<GeometryDesign>
): Partial<LineDesign>;
export function getComputedDesign(
	geometryType: 'point',
	app?: Partial<GeometryDesign>,
	layer?: Partial<GeometryDesign>,
	feature?: Partial<GeometryDesign>
): Partial<PointDesign>;
export function getComputedDesign(
	geometryType: GeometryType,
	app?: Partial<GeometryDesign>,
	layer?: Partial<GeometryDesign>,
	feature?: Partial<GeometryDesign>
): Partial<GeometryDesign> {
	const merged = mergeDesigns(app, layer, feature);
	return applyDefaultsAndFormat(merged, geometryType, FIELD_CONFIG);
}
