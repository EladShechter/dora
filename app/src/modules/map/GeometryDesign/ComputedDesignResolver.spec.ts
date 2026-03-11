import { getComputedDesign } from './ComputedDesignResolver';
import { GeometryDesign } from './NewGeometryDesign';

describe('ComputedDesignResolver', () => {

	describe('getComputedDesign', () => {

		describe('three-level merge', () => {

			it('testGetComputedDesignGivenFeatureOverridesLayerAndApp', () => {
				// given
				const app: Partial<GeometryDesign> = { 'polygon-fill-color': '#APP000' };
				const layer: Partial<GeometryDesign> = { 'polygon-fill-color': '#LAYER0' };
				const feature: Partial<GeometryDesign> = { 'polygon-fill-color': '#FEAT00' };

				// when
				const result = getComputedDesign('polygon', app, layer, feature);

				// then
				expect(result['polygon-fill-color']).toBe('#FEAT00');
			});

			it('testGetComputedDesignGivenLayerOverridesApp', () => {
				// given
				const app: Partial<GeometryDesign> = { 'polygon-fill-color': '#APP000' };
				const layer: Partial<GeometryDesign> = { 'polygon-fill-color': '#LAYER0' };

				// when
				const result = getComputedDesign('polygon', app, layer);

				// then
				expect(result['polygon-fill-color']).toBe('#LAYER0');
			});

			it('testGetComputedDesignGivenOnlyAppLevel', () => {
				// given
				const app: Partial<GeometryDesign> = { 'polygon-fill-color': '#APP000' };

				// when
				const result = getComputedDesign('polygon', app);

				// then
				expect(result['polygon-fill-color']).toBe('#APP000');
			});
		});

		describe('type extraction', () => {

			it('testGetComputedDesignGivenPolygonExtractsPolygonPrefixedFields', () => {
				// given
				const app: Partial<GeometryDesign> = {
					'polygon-fill-color': '#POLY00',
					'line-color': '#LINE00',
					'point-symbol-type': 'point',
				};

				// when
				const result = getComputedDesign('polygon', app);

				// then
				expect(result['polygon-fill-color']).toBe('#POLY00');
				expect(result['line-color']).toBeUndefined();
			});

			it('testGetComputedDesignGivenLineExtractsLinePrefixedFields', () => {
				// given
				const app: Partial<GeometryDesign> = {
					'line-color': '#LINE00',
					'line-width': 3,
					'polygon-fill-color': '#POLY00',
				};

				// when
				const result = getComputedDesign('line', app);

				// then
				expect(result['line-color']).toBe('#LINE00');
				expect(result['line-width']).toBe(3);
			});

			it('testGetComputedDesignGivenPointExtractsPointPrefixedFields', () => {
				// given
				const app: Partial<GeometryDesign> = {
					'point-symbol-type': 'point',
					'point-symbol-marker-size': 10,
				};

				// when
				const result = getComputedDesign('point', app);

				// then
				expect(result['point-symbol-type']).toBe('point');
				expect(result['point-symbol-marker-size']).toBe(10);
			});
		});

		describe('base field fallback', () => {

			it('testGetComputedDesignGivenBaseColorFallsBackForFillColor', () => {
				// given
				const app: Partial<GeometryDesign> = {
					'base-color': '#BASE00',
				};

				// when
				const result = getComputedDesign('polygon', app);

				// then
				expect(result['polygon-fill-color']).toBe('#BASE00');
			});

			it('testGetComputedDesignGivenSpecificColorOverridesBaseColor', () => {
				// given
				const app: Partial<GeometryDesign> = {
					'base-color': '#BASE00',
					'polygon-fill-color': '#FILL00',
				};

				// when
				const result = getComputedDesign('polygon', app);

				// then
				expect(result['polygon-fill-color']).toBe('#FILL00');
			});

			it('testGetComputedDesignGivenBaseLabelPositionFallsBack', () => {
				// given
				const app: Partial<GeometryDesign> = {
					'base-label-position': 'top',
				};

				// when
				const result = getComputedDesign('polygon', app);

				// then
				expect(result['polygon-label-position']).toBe('top');
			});
		});

		describe('symbol-show condition', () => {

			it('testGetComputedDesignGivenSymbolShowFalseReturnsUndefinedForSymbolFields', () => {
				// given
				const app: Partial<GeometryDesign> = {
					'polygon-symbol-show': false,
					'polygon-symbol-type': 'point',
					'polygon-symbol-marker-size': 10,
					'polygon-symbol-marker-color': '#FF0000',
				};

				// when
				const result = getComputedDesign('polygon', app);

				// then
				expect(result['polygon-symbol-type']).toBeUndefined();
				expect(result['polygon-symbol-marker-size']).toBeUndefined();
				expect(result['polygon-symbol-marker-color']).toBeUndefined();
			});

			it('testGetComputedDesignGivenSymbolShowTrueReturnsSymbolFields', () => {
				// given
				const app: Partial<GeometryDesign> = {
					'polygon-symbol-show': true,
					'polygon-symbol-type': 'point',
					'polygon-symbol-marker-size': 10,
				};

				// when
				const result = getComputedDesign('polygon', app);

				// then
				expect(result['polygon-symbol-type']).toBe('point');
				expect(result['polygon-symbol-marker-size']).toBe(10);
			});

			it('testGetComputedDesignGivenSymbolShowUndefinedReturnsSymbolFields', () => {
				// given
				const app: Partial<GeometryDesign> = {
					'polygon-symbol-type': 'point',
					'polygon-symbol-marker-size': 10,
				};

				// when
				const result = getComputedDesign('polygon', app);

				// then
				expect(result['polygon-symbol-type']).toBe('point');
				expect(result['polygon-symbol-marker-size']).toBe(10);
			});
		});

		describe('size format', () => {

			it('testGetComputedDesignGivenSizeSmallConvertsToNumber', () => {
				// given
				const app: Partial<GeometryDesign> = {
					'polygon-symbol-marker-size': 'small' as any,
				};

				// when
				const result = getComputedDesign('polygon', app);

				// then
				expect(result['polygon-symbol-marker-size']).toBe(8);
			});

			it('testGetComputedDesignGivenSizeMediumConvertsToNumber', () => {
				// given
				const app: Partial<GeometryDesign> = {
					'polygon-symbol-marker-size': 'medium' as any,
				};

				// when
				const result = getComputedDesign('polygon', app);

				// then
				expect(result['polygon-symbol-marker-size']).toBe(12);
			});

			it('testGetComputedDesignGivenSizeLargeConvertsToNumber', () => {
				// given
				const app: Partial<GeometryDesign> = {
					'polygon-symbol-marker-size': 'large' as any,
				};

				// when
				const result = getComputedDesign('polygon', app);

				// then
				expect(result['polygon-symbol-marker-size']).toBe(16);
			});

			it('testGetComputedDesignGivenSizeNumberKeepsAsIs', () => {
				// given
				const app: Partial<GeometryDesign> = {
					'polygon-symbol-marker-size': 25,
				};

				// when
				const result = getComputedDesign('polygon', app);

				// then
				expect(result['polygon-symbol-marker-size']).toBe(25);
			});
		});

		describe('color and opacity merge', () => {

			it('testGetComputedDesignGivenColorAndOpacityMergesIntoRgba', () => {
				// given
				const app: Partial<GeometryDesign> = {
					'polygon-fill-color': '#FF0000',
					'polygon-fill-opacity': 0.5,
				};

				// when
				const result = getComputedDesign('polygon', app);

				// then
				expect(result['polygon-fill-color']).toBe('rgba(255, 0, 0, 0.5)');
			});

			it('testGetComputedDesignGivenColorWithoutOpacityKeepsOriginal', () => {
				// given
				const app: Partial<GeometryDesign> = {
					'polygon-fill-color': '#FF0000',
				};

				// when
				const result = getComputedDesign('polygon', app);

				// then
				expect(result['polygon-fill-color']).toBe('#FF0000');
			});

			it('testGetComputedDesignGivenNamedColorWithOpacity', () => {
				// given
				const app: Partial<GeometryDesign> = {
					'line-color': 'red',
					'line-opacity': 0.7,
				};

				// when
				const result = getComputedDesign('line', app);

				// then
				expect(result['line-color']).toBe('rgba(255, 0, 0, 0.7)');
			});

			it('testGetComputedDesignGivenSymbolMarkerColorWithOpacity', () => {
				// given
				const app: Partial<GeometryDesign> = {
					'polygon-symbol-marker-color': '#00FF00',
					'polygon-symbol-marker-opacity': 0.3,
				};

				// when
				const result = getComputedDesign('polygon', app);

				// then
				expect(result['polygon-symbol-marker-color']).toBe('rgba(0, 255, 0, 0.3)');
			});
		});
	});
});
