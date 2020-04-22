import { MapBoxComponent } from "../MapBoxComponent";
import * as mapboxgl from "mapbox-gl";
import { MapUtils } from "../../MapUtils/MapUtils";

export class MapBoxClusterLayer {
	private clusterGeoJson: GeoJSON.FeatureCollection;
	private clusterName: string;
	private pointsDict: Map<string, GeoJSON.Feature<GeoJSON.Point>>;
	private readonly MULTI_CIRCLE_LAYER_SUFFIX = "multi-circle";
	private readonly MULTI_LABEL_LAYER_SUFFIX = "multi-label";
	private readonly SINGLE_CIRCLE_LAYER_SUFFIX = "single-circle";
	private readonly SINGLE_LABEL_LAYER_SUFFIX = "single-label";
	private readonly MAX_LITTLE_AMOUNT = 100;
	private readonly MAX_MIDDLE_AMOUNT = 750;
	private layersId: string[];

	public clusterMaxZoom: number;

	constructor(private mapComponent: MapBoxComponent) {
		this.clusterName = `cluster-${ MapUtils.generateGuid() }`;
		this.clusterMaxZoom = 10;
		this.layersId = [
			this.clusterName + this.MULTI_CIRCLE_LAYER_SUFFIX,
			this.clusterName + this.MULTI_LABEL_LAYER_SUFFIX,
			this.clusterName + this.SINGLE_CIRCLE_LAYER_SUFFIX,
			this.clusterName + this.SINGLE_LABEL_LAYER_SUFFIX
		];

		this.initializePointsData();
		this.initializeLayer();
	}

	public setVisibility(state: boolean) {
		this.layersId.forEach(layerId => {
			const clusteredLayer = this.mapComponent.nativeMapInstance.getLayer(layerId);
			this.mapComponent.geometryUtils.setGeometryVisibility(clusteredLayer, state);
		});
	}

	public addPoint(id: string, geojsonPoint: GeoJSON.Point) {
		if (this.pointsDict.has(id)) {
			const oldFeature = this.pointsDict.get(id);
			const oldFeatureIndex = this.clusterGeoJson.features.indexOf(oldFeature);
			this.clusterGeoJson.features.splice(oldFeatureIndex, 1);
		}
		const pointFeature: GeoJSON.Feature<GeoJSON.Point> = {
			type: "Feature",
			geometry: geojsonPoint,
			properties: {}
		};
		this.pointsDict.set(id, pointFeature);
		this.clusterGeoJson.features.push(pointFeature);

		const source = this.mapComponent.nativeMapInstance.getSource(this.clusterName) as mapboxgl.GeoJSONSource;
		source.setData(this.clusterGeoJson);
	}

	public removePoint(id: string) {
		if (this.pointsDict.has(id)) {
			const pointFeature = this.pointsDict.get(id);
			const featureIndex = this.clusterGeoJson.features.indexOf(pointFeature);
			this.clusterGeoJson.features.splice(featureIndex, 1);

			this.pointsDict.delete(id);

			const source = this.mapComponent.nativeMapInstance.getSource(this.clusterName) as mapboxgl.GeoJSONSource;
			source.setData(this.clusterGeoJson);
		}
	}

	public dispose() {
		delete this.clusterGeoJson;
		this.pointsDict.clear();
		delete this.pointsDict;
		this.mapComponent.nativeMapInstance.removeSource(this.clusterName);
		this.layersId.forEach(layer =>
			this.mapComponent.nativeMapInstance.removeLayer(layer));
	}

	private initializePointsData() {
		this.clusterGeoJson = {
			type: "FeatureCollection",
			features: []
		};
		this.pointsDict = new Map<string, GeoJSON.Feature<GeoJSON.Point>>();
	}

	private initializeLayer() {
		const source = this.mapComponent.nativeMapInstance.getSource(this.clusterName);
		if (!source) {
			this.mapComponent.nativeMapInstance.addSource(this.clusterName, {
				type: "geojson",
				data: this.clusterGeoJson,
				cluster: true,
				clusterMaxZoom: this.clusterMaxZoom
			});
			this.mapComponent.nativeMapInstance.addLayer({
				id: this.clusterName + this.MULTI_CIRCLE_LAYER_SUFFIX,
				type: "circle",
				source: this.clusterName,
				filter: ["has", "point_count"],
				paint: {
					// use stpes with three steps to implement three types of circles:
					//   * Blue, 20px circles when point count is less than 100
					//   * Yellow, 30px circles when point count is between 100 and 750
					//   * Pink, 40px circles when point count is greater than or equal to 750
					"circle-color": [
						"step",
						["get", "point_count"],
						"#51bbd6",
						this.MAX_LITTLE_AMOUNT,
						"#f1f075",
						this.MAX_MIDDLE_AMOUNT,
						"#f28cb1"
					],
					"circle-radius": [
						"step",
						["get", "point_count"],
						20,
						this.MAX_LITTLE_AMOUNT,
						30,
						this.MAX_MIDDLE_AMOUNT,
						40
					]
				}
			});
			this.mapComponent.nativeMapInstance.addLayer({
				id: this.clusterName + this.MULTI_LABEL_LAYER_SUFFIX,
				type: "symbol",
				source: this.clusterName,
				filter: ["has", "point_count"],
				layout: {
					"text-field": "{point_count_abbreviated}",
					"text-size": 12
				}
			});

			this.mapComponent.nativeMapInstance.addLayer({
				id: this.clusterName + this.SINGLE_CIRCLE_LAYER_SUFFIX,
				type: "circle",
				source: this.clusterName,
				filter: ["!", ["has", "point_count"]],
				paint: {
					"circle-color": "#11b4da",
					"circle-radius": 15
				},
				maxzoom: this.clusterMaxZoom + 1
			});

			this.mapComponent.nativeMapInstance.addLayer({
				id: this.clusterName + this.SINGLE_LABEL_LAYER_SUFFIX,
				type: "symbol",
				source: this.clusterName,
				filter: ["!", ["has", "point_count"]],
				layout: {
					"text-field": "1",
					"text-size": 12
				},
				maxzoom: this.clusterMaxZoom + 1
			});
		}
	}
}