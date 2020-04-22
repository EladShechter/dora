import { Layer } from "../../Layers/Layer";
import { ILayerChild } from "../../Layers/ILayerChild";
import { MapBoxComponent } from "../MapBoxComponent";
import * as mapboxgl from "mapbox-gl";
import { ILayer } from "../../Layers/ILayer";
import { MapBoxClusterLayer } from "./MapBoxClusterLayer";

export class MapBoxLayer extends Layer {
	protected mapComponent: MapBoxComponent;
	private clusterLayer: MapBoxClusterLayer;

	constructor(mapComponent: MapBoxComponent) {
		super(mapComponent);
		if (this.mapComponent.useCluster) {
			this.clusterLayer = new MapBoxClusterLayer(this.mapComponent);
		}
	}

	public addGeometry(geometry: ILayerChild): void {
		this.geometries.push(geometry);
		if (this.displayed) {
			geometry.addToLayer(this);
		}
	}

	public removeGeometry(geometry: ILayerChild): void {
		if (!this.geometries.includes(geometry)) {
			return;
		}
		this.geometries = this.geometries.filter(g => g !== geometry);
		geometry.removeFromLayer(this);
	}

	// internal
	public addNativeGeometryToMap(nativeGeometry: mapboxgl.Layer, geoJson?: GeoJSON.Point): void {
		const layerOnMap = this.mapComponent.nativeMapInstance.getLayer(nativeGeometry.id);
		if (this.displayed && !layerOnMap) {
			this.mapComponent.nativeMapInstance.addLayer(nativeGeometry);
		}

		if (this.clusterLayer) {
			if (geoJson) {
				this.clusterLayer.addPoint(nativeGeometry.id, geoJson);
			}

			this.mapComponent.geometryUtils.applyAfterLayerAdded(nativeGeometry).then(() => {
				const minZoom = this.clusterLayer.clusterMaxZoom + 1;
				const maxZoom = this.mapComponent.nativeMapInstance.getMaxZoom();
				this.mapComponent.nativeMapInstance.setLayerZoomRange(nativeGeometry.id, minZoom, maxZoom);
			});
		}
	}
	// internal
	public removeNativeGeometryFromMap(nativeGeometry: mapboxgl.Layer, addedToMap: boolean, addedToLayers: ILayer[]): void {
		if (!addedToMap && addedToLayers.filter(l => l !== this).length === 0) {
			this.mapComponent.nativeMapInstance.removeLayer(nativeGeometry.id);
		}

		if (this.clusterLayer) {
			this.clusterLayer.removePoint(nativeGeometry.id);

			if (addedToMap) {
				const minZoom = this.mapComponent.nativeMapInstance.getMinZoom();
				const maxZoom = this.mapComponent.nativeMapInstance.getMaxZoom();
				this.mapComponent.nativeMapInstance.setLayerZoomRange(nativeGeometry.id, minZoom, maxZoom);
			}
		}
	}

	public show(): void {
		if (this.clusterLayer) {
			this.clusterLayer.setVisibility(true);
		}

		if (!this.displayed) {
			this.displayed = true;
			this.geometries.forEach(geometry => {
				geometry.addToLayer(this);
				geometry.setVisibility(true);
			});
		}
	}

	public hide(): void {
		if (this.clusterLayer && this.displayed) {
			this.clusterLayer.setVisibility(false);
		}

		this.geometries.forEach(geometry => {
			geometry.setVisibility(false);
		});
		this.displayed = false;
	}

	public remove(): void {
		if (this.clusterLayer) {
			this.clusterLayer.dispose();
		}
		this.displayed = false;
		this.geometries.forEach(geometry => {
			geometry.removeFromLayer(this);
		});
	}

}