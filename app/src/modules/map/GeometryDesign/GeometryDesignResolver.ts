import { GeometryDesign } from './NewGeometryDesign';

/**
 * Supported geometry types for property resolution.
 */
export type GeometryType = 'point' | 'line' | 'polygon';

/**
 * Property categories that have geometry-type-specific prefixes.
 */
type PropertyCategory = 'symbol' | 'label' | 'icon' | 'outline';

/**
 * Extracts all keys from GeometryDesign as a union type.
 */
export type GeometryDesignKey = keyof GeometryDesign;

/**
 * Configuration for the three-level design inheritance.
 * Resolution order: feature → layer → app (first defined value wins).
 */
export interface IDesignHierarchy {
	app?: Partial<GeometryDesign>;
	layer?: Partial<GeometryDesign>;
	feature?: Partial<GeometryDesign>;
}

/**
 * Internal representation of a color with alpha channel.
 */
interface ParsedColor {
	r: number;
	g: number;
	b: number;
	a: number;
}

/**
 * Resolves geometry design properties with support for:
 * - Geometry-type-specific key fallbacks (e.g., polygon-symbol-type → symbol-type)
 * - Three-level inheritance (feature → layer → app)
 * - Special inheritance rules (base-color, opacity overrides)
 */
export class GeometryDesignResolver {
	private readonly hierarchy: IDesignHierarchy;

	constructor(hierarchy: IDesignHierarchy) {
		this.hierarchy = hierarchy;
	}

	/**
	 * Creates a resolver with only app-level defaults.
	 */
	static fromApp(appDesign: Partial<GeometryDesign>): GeometryDesignResolver {
		return new GeometryDesignResolver({ app: appDesign });
	}

	/**
	 * Creates a new resolver with an additional layer design.
	 */
	withLayer(layerDesign: Partial<GeometryDesign>): GeometryDesignResolver {
		return new GeometryDesignResolver({
			...this.hierarchy,
			layer: layerDesign,
		});
	}

	/**
	 * Creates a new resolver with an additional feature design.
	 */
	withFeature(featureDesign: Partial<GeometryDesign>): GeometryDesignResolver {
		return new GeometryDesignResolver({
			...this.hierarchy,
			feature: featureDesign,
		});
	}

	/**
	 * Resolves a design property for a specific geometry type.
	 * 
	 * Resolution order:
	 * 1. Check geometry-specific key in feature → layer → app
	 * 2. Check base key in feature → layer → app
	 * 3. Apply special inheritance (base-color for colors)
	 * 4. Apply opacity override if applicable
	 * 
	 * @param geometryType The geometry type (point, line, polygon)
	 * @param baseKey The base property key (e.g., 'symbol-type', 'color')
	 * @returns The resolved value or undefined if not found
	 */
	resolve<K extends GeometryDesignKey>(
		geometryType: GeometryType,
		baseKey: K
	): GeometryDesign[K] | undefined {
		const fallbackChain = this.buildFallbackChain(geometryType, baseKey);
		let resolvedValue = this.resolveFromChain(fallbackChain);

		if (resolvedValue === undefined && this.isColorProperty(baseKey)) {
			resolvedValue = this.resolveBaseColor(geometryType) as GeometryDesign[K];
		}

		if (resolvedValue !== undefined && this.isColorProperty(baseKey)) {
			resolvedValue = this.applyOpacityOverride(
				geometryType,
				baseKey,
				resolvedValue as string
			) as GeometryDesign[K];
		}

		return resolvedValue;
	}

	/**
	 * Resolves all properties for a geometry type, returning a merged design object.
	 */
	resolveAll(geometryType: GeometryType): Partial<GeometryDesign> {
		const result: Partial<GeometryDesign> = {};
		const allKeys = this.collectAllKeys();

		for (const key of allKeys) {
			const value = this.resolve(geometryType, key as GeometryDesignKey);
			if (value !== undefined) {
				(result as Record<string, unknown>)[key] = value;
			}
		}

		return result;
	}

	/**
	 * Builds the fallback chain for a property based on geometry type.
	 * 
	 * For geometry type 'polygon' and base key 'symbol-type':
	 * Chain: ['polygon-symbol-type', 'symbol-type']
	 * 
	 * For geometry type 'point' and base key 'symbol-type':
	 * Chain: ['symbol-type'] (point is the base, no prefix)
	 */
	private buildFallbackChain(
		geometryType: GeometryType,
		baseKey: GeometryDesignKey
	): string[] {
		const chain: string[] = [];

		if (geometryType !== 'point') {
			const prefixedKey = this.buildPrefixedKey(geometryType, baseKey);
			if (prefixedKey !== baseKey) {
				chain.push(prefixedKey);
			}
		}

		chain.push(baseKey);
		return chain;
	}

	/**
	 * Builds a geometry-prefixed key.
	 */
	private buildPrefixedKey(
		geometryType: GeometryType,
		baseKey: GeometryDesignKey
	): string {
		if (geometryType === 'point') {
			return baseKey;
		}
		return `${geometryType}-${baseKey}`;
	}

	/**
	 * Resolves a value by checking each key in the fallback chain
	 * against the hierarchy levels.
	 */
	private resolveFromChain(fallbackChain: string[]): unknown {
		for (const key of fallbackChain) {
			const value = this.resolveFromHierarchy(key);
			if (value !== undefined) {
				return value;
			}
		}
		return undefined;
	}

	/**
	 * Resolves a single key through the three-level hierarchy.
	 * Order: feature → layer → app
	 */
	private resolveFromHierarchy(key: string): unknown {
		const levels: (keyof IDesignHierarchy)[] = ['feature', 'layer', 'app'];

		for (const level of levels) {
			const design = this.hierarchy[level];
			if (design && key in design) {
				const value = (design as Record<string, unknown>)[key];
				if (value !== undefined) {
					return value;
				}
			}
		}

		return undefined;
	}

	/**
	 * Determines if a property key represents a color value.
	 */
	private isColorProperty(key: GeometryDesignKey): boolean {
		const keyStr = String(key);
		return keyStr.endsWith('-color') || keyStr === 'color';
	}

	/**
	 * Determines if a property key represents an opacity value.
	 */
	private isOpacityProperty(key: string): boolean {
		return key.endsWith('-opacity') || key === 'opacity';
	}

	/**
	 * Resolves base-color fallback for color properties.
	 */
	private resolveBaseColor(geometryType: GeometryType): string | undefined {
		const baseColorChain = this.buildFallbackChain(geometryType, 'base-color' as GeometryDesignKey);
		baseColorChain.push('base-color');
		return this.resolveFromChain([...new Set(baseColorChain)]) as string | undefined;
	}

	/**
	 * Applies opacity override to a color value.
	 * Checks for geometry-specific opacity first, then general opacity.
	 */
	private applyOpacityOverride(
		geometryType: GeometryType,
		colorKey: GeometryDesignKey,
		colorValue: string
	): string {
		const opacityKey = this.deriveOpacityKey(colorKey);
		if (!opacityKey) {
			return colorValue;
		}

		const opacity = this.resolve(geometryType, opacityKey as GeometryDesignKey);
		if (opacity === undefined || typeof opacity !== 'number') {
			return colorValue;
		}

		return this.applyAlphaToColor(colorValue, opacity);
	}

	/**
	 * Derives the corresponding opacity key for a color key.
	 * e.g., 'polygon-fill-color' → 'polygon-fill-opacity'
	 */
	private deriveOpacityKey(colorKey: GeometryDesignKey): string | undefined {
		const keyStr = String(colorKey);
		if (keyStr.endsWith('-color')) {
			return keyStr.replace(/-color$/, '-opacity');
		}
		if (keyStr === 'color') {
			return 'opacity';
		}
		return undefined;
	}

	/**
	 * Applies an alpha value to a color string.
	 * Supports hex (#RGB, #RRGGBB, #RRGGBBAA), rgb(), and rgba() formats.
	 */
	private applyAlphaToColor(color: string, alpha: number): string {
		const parsed = this.parseColor(color);
		if (!parsed) {
			return color;
		}

		parsed.a = Math.max(0, Math.min(1, alpha));
		return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${parsed.a})`;
	}

	/**
	 * Parses a color string into RGBA components.
	 */
	private parseColor(color: string): ParsedColor | null {
		const trimmed = color.trim().toLowerCase();

		if (trimmed.startsWith('#')) {
			return this.parseHexColor(trimmed);
		}

		if (trimmed.startsWith('rgb')) {
			return this.parseRgbColor(trimmed);
		}

		return this.parseNamedColor(trimmed);
	}

	/**
	 * Parses hex color formats.
	 */
	private parseHexColor(hex: string): ParsedColor | null {
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

	/**
	 * Parses rgb() and rgba() color formats.
	 */
	private parseRgbColor(rgb: string): ParsedColor | null {
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

	/**
	 * Parses named colors (basic set).
	 */
	private parseNamedColor(name: string): ParsedColor | null {
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

	/**
	 * Collects all unique keys from all hierarchy levels.
	 */
	private collectAllKeys(): Set<string> {
		const keys = new Set<string>();
		const levels: (keyof IDesignHierarchy)[] = ['app', 'layer', 'feature'];

		for (const level of levels) {
			const design = this.hierarchy[level];
			if (design) {
				Object.keys(design).forEach(key => keys.add(key));
			}
		}

		return keys;
	}
}
