export type IconOrigin =
	| 'bottom center'
	| 'top center'
	| 'center center'
	| 'center right'
	| 'center left';

export type IconImage = `https://${string}` | `http://${string}` | `data:image/png;base64,${string}`;

export type PositionRelativeToGeometry = 'top' | 'bottom' | 'center' | 'left' | 'right' | 'centroid' | 'first-point';

export type PositionRelativeToIcon = 'top' | 'bottom' | 'left' | 'right';

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
	'label-font-size'?: number;
	'label-font-color'?: string;
	'label-background-color'?: string;
	'label-origin'?: IconOrigin;
	'label-position'?: PositionRelativeToGeometry;
	'label-icon-relative-position'?: PositionRelativeToIcon;
};

/**
 * Custom image icon symbol.
 * Discriminated by symbol-type = 'icon'
 */
export type IconDesign = {
	'symbol-type': 'icon';
	'icon-image'?: IconImage;
	'icon-opacity'?: number;
	'icon-width'?: number;
	'icon-height'?: number;
	'icon-angle'?: number;
	'icon-origin'?: IconOrigin;
};

/**
 * Built-in point/marker symbol.
 * Discriminated by symbol-type = 'point' | 'marker'
 */
export type SymbolDesign = {
	'symbol-type': 'point' | 'marker';
	'symbol-size'?: number;
	'symbol-color'?: string;
	'symbol-opacity'?: number;
	'symbol-outline-color'?: string;
	'symbol-outline-opacity'?: number;
	'symbol-outline-width'?: number;
};

/**
 * Adds optional relative position for a symbol/icon placed on a geometry.
 */
export type Positioned<T> = T & {
	'symbol-position'?: PositionRelativeToGeometry;
};

/**
 * PointDesign: (icon OR symbol) + optional positioning.
 * Used for:
 * - actual Point geometries (unprefixed)
 * - symbols/icons embedded in polygon/line (prefixed)
 */
export type PointDesign = Positioned<IconDesign | SymbolDesign>;

export type PolygonDesign =
	& {
		'polygon-type'?: 'outline' | 'fill' | 'outline fill';
		'polygon-fill-color'?: string;
		'polygon-fill-opacity'?: number;
	}
	& PrefixKeys<StrokeDesign, 'polygon-outline'>
	& PrefixKeys<PointDesign, 'polygon'>
	& PrefixKeys<LabelDesign, 'polygon'>;

export type LineDesign =
	& PrefixKeys<StrokeDesign, 'line'>
	& PrefixKeys<PointDesign, 'line'>
	& PrefixKeys<LabelDesign, 'line'>;

export type GeometryDesign =
	& { 'base-color'?: string }
	& PolygonDesign
	& LineDesign
	& PointDesign
	& LabelDesign;

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
	'polygon-symbol-type': 'marker',
	'polygon-symbol-position': 'center',
	'polygon-symbol-size': 10,
	'polygon-symbol-color': '#41DDCE',

	// Label embedded in polygon (positioned relative to polygon)
	'polygon-label-position': 'center',

	// Line
	'line-color': '#41DDCE',
	'line-opacity': 1,
	'line-width': 2,

	// Symbol/icon embedded in line (positioned relative to line)
	'line-symbol-type': 'point',
	'line-symbol-position': 'center',
	'line-symbol-size': 6,
	'line-symbol-color': '#41DDCE',

	// Label embedded in line (positioned relative to line)
	'line-label-position': 'center',

	// Point geometry itself (center-anchored; symbol-position typically ignored)
	'symbol-type': 'point',
	'symbol-size': 6,
	'symbol-color': '#41DDCE',
	'symbol-opacity': 1,
	'symbol-outline-color': 'black',
	'symbol-outline-opacity': 1,
	'symbol-outline-width': 1,

	// Point label
	'label-position': 'top',
};