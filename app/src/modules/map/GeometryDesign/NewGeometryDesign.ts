export type IconOrigin =
	| 'bottom center'
	| 'top center'
	| 'center center'
	| 'center right'
	| 'center left';

export type IconImage = `https://${string}` | `http://${string}` | `data:image/png;base64,${string}`;

export type PositionRelativeToGeometry = 'top' | 'bottom' | 'center' | 'left' | 'right' | 'centroid' | 'first-point';

export type PositionRelativeToIcon = 'top' | 'bottom' | 'left' | 'right';
type Size = number | 'small' | 'medium' | 'large';

/**
 * Prefix all keys in T with "<prefix>-".
 * Works with kebab-case keys.
 */
export type PrefixKeys<T, Prefix extends string> = {
	[K in keyof T as `${Prefix}-${Extract<K, string>}`]: T[K];
};

export type StrokeDesign = {
	'color'?: string;
	'opacity'?: number;
	'width'?: number;
};

export type LabelDesign = {
	'label-text'?: string;
	'label-opacity'?: number;
	'label-font-size'?: Size;
	'label-font-color'?: string;
	'label-background-color'?: string;
	'label-origin'?: IconOrigin;
	'label-icon-relative-position'?: PositionRelativeToIcon;
};

/**
 * Custom image icon symbol.
 * Discriminated by symbol-type = 'icon'
 */
export type IconDesign = {
	'symbol-type': 'custom';
	'symbol-custom-image'?: IconImage;
	'symbol-custom-opacity'?: number;
	'symbol-custom-width'?: number;
	'symbol-custom-height'?: number;
	'symbol-custom-angle'?: number;
	'symbol-custom-origin'?: IconOrigin;
};

/**
 * Built-in point/marker symbol.
 * Discriminated by symbol-type = 'point' | 'pin'
 */
export type MarkerDesign = {
	'symbol-type': 'point' | 'pin';
	'symbol-marker-size'?: number;
	'symbol-marker-color'?: string;
	'symbol-marker-opacity'?: number;
	'symbol-marker-outline-color'?: string;
	'symbol-marker-outline-opacity'?: number;
	'symbol-marker-outline-width'?: number;
};

export type SymbolDesign = (IconDesign | MarkerDesign);


/**
 * PointDesign: (icon OR symbol) + optional positioning.
 * Used for:
 * - actual Point geometries (unprefixed)
 * - symbols/icons embedded in polygon/line (prefixed)
 */
export type SymbolAndLabelForGeometryDesign =
	& {
		'symbol-position'?: PositionRelativeToGeometry;
		'symbol-show'?: boolean;
		'label-position'?: PositionRelativeToGeometry;
	}
	& SymbolDesign
	& LabelDesign;

export type PolygonDesign =
	& {
		'polygon-type'?: 'outline' | 'fill' | 'outline fill';
		'polygon-fill-color'?: string;
		'polygon-fill-opacity'?: number;
	}
	& PrefixKeys<StrokeDesign, 'polygon-outline'>
	& PrefixKeys<SymbolAndLabelForGeometryDesign, 'polygon'>;

export type LineDesign =
	& PrefixKeys<StrokeDesign, 'line'>
	& PrefixKeys<SymbolAndLabelForGeometryDesign, 'line'>;

export type PointDesign =
	& PrefixKeys<SymbolDesign, 'point'>
	& PrefixKeys<LabelDesign, 'point'>;

export type GeometryDesign =
	& { 'base-color'?: string }
	& PrefixKeys<SymbolDesign, 'base'>
	& PrefixKeys<LabelDesign, 'base'>
	& PolygonDesign
	& LineDesign
	& PointDesign
;

/**
 * Example defaults
 */
export const defaultGeometryDesign: GeometryDesign = {
	// Polygon
	'polygon-type': 'fill',
	'polygon-fill-color': 'black',
	'polygon-fill-opacity': 0.2,
	'polygon-outline-color': 'black',
	'polygon-outline-opacity': 1,
	'polygon-outline-width': 1,

	// Symbol/icon embedded in polygon (positioned relative to polygon)
	'polygon-symbol-type': 'point',
	'polygon-symbol-position': 'center',
	'polygon-symbol-marker-size': 10,
	'polygon-symbol-marker-color': '#41DDCE',

	// Label embedded in polygon (positioned relative to polygon)
	'polygon-label-position': 'center',

	// Line
	'line-color': '#41DDCE',
	'line-opacity': 1,
	'line-width': 2,

	// Symbol/icon embedded in line (positioned relative to line)
	'line-symbol-type': 'point',
	'line-symbol-position': 'center',
	'line-symbol-marker-size': 6,
	'line-symbol-marker-color': '#41DDCE',

	// Label embedded in line (positioned relative to line)
	'line-label-position': 'center',

	// Point geometry itself
	'point-symbol-type': 'point',
	'point-symbol-marker-size': 6,
	'point-symbol-marker-color': '#41DDCE',
	'point-symbol-marker-opacity': 1,
	'point-symbol-marker-outline-color': 'black',
	'point-symbol-marker-outline-opacity': 1,
	'point-symbol-marker-outline-width': 1,

	// Point label
	'point-label-position': 'top',
	'base-label-position': 'top',
};