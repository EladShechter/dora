
import { MapBoxComponent } from "../MapBoxComponent";
import { IGraphicsUtils } from "../../GraphicsUtils/IGraphicsUtils";
import { Coordinate } from "../../Geometries/Coordinate";
import * as mapboxgl from "mapbox-gl";;


export class MapBoxGraphicsUtils implements IGraphicsUtils {
	constructor(private mapComponent: MapBoxComponent) {
	}

	addMarkArrow(coordinate: Coordinate): mapboxgl.Marker {
		const markerDiv = document.createElement("div");
		markerDiv.className = "mapbox-marker-highlight-animated-icon";
		markerDiv.innerHTML = `
			<div class='highlight-arrow highlight-arrow-bounce'></div>
			<div class='markerHighlighFlare'></div>
			<div class='markerHighlighGlow'></div>`;

		return new mapboxgl.Marker({
			element: markerDiv,
			anchor: "center"
		})
		.setLngLat([coordinate.longitude, coordinate.latitude])
		.addTo(this.mapComponent.nativeMapInstance);
	}

	removeMarkArrow(marker: mapboxgl.Marker): void {
		marker.remove();
	}
}