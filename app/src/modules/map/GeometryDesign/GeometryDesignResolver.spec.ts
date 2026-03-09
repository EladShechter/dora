import { GeometryDesignResolver, IDesignHierarchy } from './GeometryDesignResolver';
import { GeometryDesign } from './NewGeometryDesign';

describe('GeometryDesignResolver', () => {

	describe('resolve', () => {

		describe('geometry-type key fallback', () => {

			it('testResolveGivenPolygonSpecificKeyExists', () => {
				// given
				const hierarchy: IDesignHierarchy = {
					app: {
						'symbol-type': 'point',
						'polygon-symbol-type': 'marker',
					},
				};
				const resolver = new GeometryDesignResolver(hierarchy);

				// when
				const result = resolver.resolve('polygon', 'symbol-type');

				// then
				expect(result).toBe('marker');
			});

			it('testResolveGivenPolygonSpecificKeyMissingFallsBackToBase', () => {
				// given
				const hierarchy: IDesignHierarchy = {
					app: {
						'symbol-type': 'point',
					},
				};
				const resolver = new GeometryDesignResolver(hierarchy);

				// when
				const result = resolver.resolve('polygon', 'symbol-type');

				// then
				expect(result).toBe('point');
			});

			it('testResolveGivenLineSpecificKeyExists', () => {
				// given
				const hierarchy: IDesignHierarchy = {
					app: {
						'symbol-color': '#FF0000',
						'line-symbol-color': '#00FF00',
					},
				};
				const resolver = new GeometryDesignResolver(hierarchy);

				// when
				const result = resolver.resolve('line', 'symbol-color');

				// then
				expect(result).toBe('#00FF00');
			});

			it('testResolveGivenPointUsesBaseKeyDirectly', () => {
				// given
				const hierarchy: IDesignHierarchy = {
					app: {
						'symbol-type': 'marker',
					},
				};
				const resolver = new GeometryDesignResolver(hierarchy);

				// when
				const result = resolver.resolve('point', 'symbol-type');

				// then
				expect(result).toBe('marker');
			});
		});

		describe('three-level hierarchy inheritance', () => {

			it('testResolveGivenFeatureLevelOverridesLayerAndApp', () => {
				// given
				const hierarchy: IDesignHierarchy = {
					app: { 'symbol-color': '#APP000' },
					layer: { 'symbol-color': '#LAYER0' },
					feature: { 'symbol-color': '#FEAT00' },
				};
				const resolver = new GeometryDesignResolver(hierarchy);

				// when
				const result = resolver.resolve('point', 'symbol-color');

				// then
				expect(result).toBe('#FEAT00');
			});

			it('testResolveGivenLayerLevelOverridesApp', () => {
				// given
				const hierarchy: IDesignHierarchy = {
					app: { 'symbol-color': '#APP000' },
					layer: { 'symbol-color': '#LAYER0' },
				};
				const resolver = new GeometryDesignResolver(hierarchy);

				// when
				const result = resolver.resolve('point', 'symbol-color');

				// then
				expect(result).toBe('#LAYER0');
			});

			it('testResolveGivenOnlyAppLevelDefined', () => {
				// given
				const hierarchy: IDesignHierarchy = {
					app: { 'symbol-color': '#APP000' },
				};
				const resolver = new GeometryDesignResolver(hierarchy);

				// when
				const result = resolver.resolve('point', 'symbol-color');

				// then
				expect(result).toBe('#APP000');
			});

			it('testResolveGivenFeatureSpecificKeyOverridesLayerBaseKey', () => {
				// given
				const hierarchy: IDesignHierarchy = {
					layer: { 'symbol-type': 'point' },
					feature: { 'polygon-symbol-type': 'marker' },
				};
				const resolver = new GeometryDesignResolver(hierarchy);

				// when
				const result = resolver.resolve('polygon', 'symbol-type');

				// then
				expect(result).toBe('marker');
			});

			it('testResolveGivenNoValueDefinedReturnsUndefined', () => {
				// given
				const hierarchy: IDesignHierarchy = {
					app: {},
				};
				const resolver = new GeometryDesignResolver(hierarchy);

				// when
				const result = resolver.resolve('point', 'symbol-color');

				// then
				expect(result).toBeUndefined();
			});
		});

		describe('base-color fallback', () => {

			it('testResolveGivenBaseColorFallsBackForMissingColorProperty', () => {
				// given
				const hierarchy: IDesignHierarchy = {
					app: { 'base-color': '#BASE00' },
				};
				const resolver = new GeometryDesignResolver(hierarchy);

				// when
				const result = resolver.resolve('point', 'symbol-color');

				// then
				expect(result).toBe('#BASE00');
			});

			it('testResolveGivenSpecificColorOverridesBaseColor', () => {
				// given
				const hierarchy: IDesignHierarchy = {
					app: {
						'base-color': '#BASE00',
						'symbol-color': '#SYMBOL',
					},
				};
				const resolver = new GeometryDesignResolver(hierarchy);

				// when
				const result = resolver.resolve('point', 'symbol-color');

				// then
				expect(result).toBe('#SYMBOL');
			});

			it('testResolveGivenPolygonFillColorMissingUsesBaseColor', () => {
				// given
				const hierarchy: IDesignHierarchy = {
					app: { 'base-color': '#BASE00' },
				};
				const resolver = new GeometryDesignResolver(hierarchy);

				// when
				const result = resolver.resolve('polygon', 'polygon-fill-color');

				// then
				expect(result).toBe('#BASE00');
			});
		});

		describe('opacity override', () => {

			it('testResolveGivenOpacityOverridesColorAlpha', () => {
				// given
				const hierarchy: IDesignHierarchy = {
					app: {
						'symbol-color': '#FF0000',
						'symbol-opacity': 0.5,
					},
				};
				const resolver = new GeometryDesignResolver(hierarchy);

				// when
				const result = resolver.resolve('point', 'symbol-color');

				// then
				expect(result).toBe('rgba(255, 0, 0, 0.5)');
			});

			it('testResolveGivenPolygonFillOpacityOverridesFillColorAlpha', () => {
				// given
				const hierarchy: IDesignHierarchy = {
					app: {
						'polygon-fill-color': '#00FF00',
						'polygon-fill-opacity': 0.3,
					},
				};
				const resolver = new GeometryDesignResolver(hierarchy);

				// when
				const result = resolver.resolve('polygon', 'polygon-fill-color');

				// then
				expect(result).toBe('rgba(0, 255, 0, 0.3)');
			});

			it('testResolveGivenNoOpacityPreservesOriginalColor', () => {
				// given
				const hierarchy: IDesignHierarchy = {
					app: { 'symbol-color': '#FF0000' },
				};
				const resolver = new GeometryDesignResolver(hierarchy);

				// when
				const result = resolver.resolve('point', 'symbol-color');

				// then
				expect(result).toBe('#FF0000');
			});

			it('testResolveGivenRgbaColorWithOpacityOverride', () => {
				// given
				const hierarchy: IDesignHierarchy = {
					app: {
						'symbol-color': 'rgba(100, 150, 200, 0.8)',
						'symbol-opacity': 0.2,
					},
				};
				const resolver = new GeometryDesignResolver(hierarchy);

				// when
				const result = resolver.resolve('point', 'symbol-color');

				// then
				expect(result).toBe('rgba(100, 150, 200, 0.2)');
			});

			it('testResolveGivenNamedColorWithOpacityOverride', () => {
				// given
				const hierarchy: IDesignHierarchy = {
					app: {
						'symbol-color': 'red',
						'symbol-opacity': 0.7,
					},
				};
				const resolver = new GeometryDesignResolver(hierarchy);

				// when
				const result = resolver.resolve('point', 'symbol-color');

				// then
				expect(result).toBe('rgba(255, 0, 0, 0.7)');
			});
		});
	});

	describe('builder methods', () => {

		it('testFromAppCreatesResolverWithAppLevel', () => {
			// given
			const appDesign: Partial<GeometryDesign> = { 'symbol-type': 'point' };

			// when
			const resolver = GeometryDesignResolver.fromApp(appDesign);
			const result = resolver.resolve('point', 'symbol-type');

			// then
			expect(result).toBe('point');
		});

		it('testWithLayerAddsLayerLevel', () => {
			// given
			const resolver = GeometryDesignResolver.fromApp({ 'symbol-type': 'point' })
				.withLayer({ 'symbol-type': 'marker' });

			// when
			const result = resolver.resolve('point', 'symbol-type');

			// then
			expect(result).toBe('marker');
		});

		it('testWithFeatureAddsFeatureLevel', () => {
			// given
			const resolver = GeometryDesignResolver.fromApp({ 'symbol-type': 'point' })
				.withLayer({ 'symbol-type': 'marker' })
				.withFeature({ 'symbol-type': 'icon' });

			// when
			const result = resolver.resolve('point', 'symbol-type');

			// then
			expect(result).toBe('icon');
		});
	});

	describe('resolveAll', () => {

		it('testResolveAllGivenPolygonMergesAllLevels', () => {
			// given
			const hierarchy: IDesignHierarchy = {
				app: {
					'symbol-type': 'point',
					'symbol-color': '#APP000',
				},
				layer: {
					'polygon-fill-color': '#LAYER0',
				},
				feature: {
					'polygon-symbol-type': 'marker',
				},
			};
			const resolver = new GeometryDesignResolver(hierarchy);

			// when
			const result = resolver.resolveAll('polygon');

			// then
			expect(result['polygon-symbol-type']).toBe('marker');
			expect(result['polygon-fill-color']).toBe('#LAYER0');
			expect(result['symbol-type']).toBe('point');
			expect(result['symbol-color']).toBe('#APP000');
		});
	});
});
