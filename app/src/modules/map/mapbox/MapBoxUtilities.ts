import { MapEventArgs } from "../Events/MapEventArgs";
import { Coordinate } from "../Geometries/Coordinate";
import { IUtilities } from "../MapUtils/IUtilities";
import { ScreenCoordinate } from "../GraphicsUtils/ScreenCoordinate";
import { Geometry } from "../Geometries/Geometry";
import * as mapboxgl from "mapbox-gl";
import { MapBoxComponent } from "./MapBoxComponent";

export class MapBoxUtilties implements IUtilities {
	constructor(private mapComponent: MapBoxComponent) { }

	public static lngLatToCoordinate(latlng: mapboxgl.LngLat): Coordinate {
		return new Coordinate(latlng.lat, latlng.lng);
	}

	public static lngLatsToCoordinates(latlngs: mapboxgl.LngLat[]): Coordinate[] {
		return latlngs.map(latLng => this.lngLatToCoordinate(latLng));
	}

	public static lngLatsRingsToCoordinatesRings(latlngsRings: mapboxgl.LngLat[][]): Coordinate[][] {
		return latlngsRings.map(ring => this.lngLatsToCoordinates(ring));
	}

	public static coordinateToLngLat(coordinate: Coordinate): mapboxgl.LngLat {
		return new mapboxgl.LngLat(coordinate.longitude, coordinate.latitude);
	}

	public static coordinatesToLngLats(coordinates: Coordinate[]): mapboxgl.LngLat[] {
		return coordinates.map(coord => this.coordinateToLngLat(coord));
	}

	public static coordinatesRingsToLngLatsRings(coordsRings: Coordinate[][]): mapboxgl.LngLat[][] {
		return coordsRings.map(ring => this.coordinatesToLngLats(ring));
	}

	public pickEntity(eventArgs: MapEventArgs): Geometry {
		throw new Error("Method not implemented.");
	}

	public pickEntities(eventArgs: MapEventArgs, maxEntities?: number): Geometry[] {
		throw new Error("Method not implemented.");
	}

	public entitiesAmountInPositionGreaterThan(eventArgs: MapEventArgs, num: number): boolean {
		throw new Error("Method not implemented.");
	}

	public onMouseEvent(eventName: string, listener: (eventArgs?: MapEventArgs) => void): () => void {
		const listenerHandler = this.getNativeListenerHandler(listener);

		this.mapComponent.nativeMapInstance.on(eventName, listenerHandler);
		return () => {
			this.mapComponent.nativeMapInstance.off(eventName, listenerHandler);
		};
	}

	public addEntityMouseEvent(listener: (eventArgs?: MapEventArgs) => void, eventName: keyof mapboxgl.MapLayerEventType, layer: mapboxgl.Layer): () => void {
		const listenerHandler = this.getNativeListenerHandler(listener);
		this.mapComponent.nativeMapInstance.on(eventName, layer.id, listenerHandler);
		return () => {
			this.mapComponent.nativeMapInstance.off(eventName, layer.id, listenerHandler);
		};
	}

	private getNativeListenerHandler(listener: (eventArgs?: MapEventArgs) => void) {
		return (event: mapboxgl.MapMouseEvent) => {
			const mapEventArgs: MapEventArgs = new MapEventArgs(
				event.lngLat.lng,
				event.lngLat.lat,
				0,
				event.originalEvent.button,
				event.originalEvent.ctrlKey,
				event.originalEvent.altKey,
				event.originalEvent.shiftKey,
				event.point.x,
				event.point.y,
				() => event.originalEvent.preventDefault(),
				event);

			listener(mapEventArgs);
		};
	}

	public addEntityMouseOutEvent(listener: (eventArgs?: MapEventArgs) => void, eventType: number, entity): () => void {
		throw new Error("Method not implemented.");
	}

	public toScreenPosFromCoordinate(coordinate: Coordinate): ScreenCoordinate {
		const lngLat = MapBoxUtilties.coordinateToLngLat(coordinate);
		return this.mapComponent.nativeMapInstance.project(lngLat);
	}
}