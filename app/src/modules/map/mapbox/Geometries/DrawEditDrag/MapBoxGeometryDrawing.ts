import { IActionToken } from "../../../Common/IActionToken";
import { IArrowGeometryDesign } from "../../../GeometryDesign/Interfaces/IArrrowGeometryDesign";
import { IDoubleLineGeometryDesign } from "../../../GeometryDesign/Interfaces/IDoubleLineGeometryDesign";
import { IGeometryDesign } from "../../../GeometryDesign/Interfaces/IGeometryDesign";
import { Arrow } from "../../../Geometries/Arrow";
import { Coordinate } from "../../../Geometries/Coordinate";
import { Line } from "../../../Geometries/Line";
import { Point } from "../../../Geometries/Point";
import { Polygon } from "../../../Geometries/Polygon";
import { DoubleLine } from "../../../Geometries/DoubleLine";
import { IGeometryDrawing } from "../../../Geometries/Drawing/IGeometryDrawing";
import { MapBoxComponent } from "../../MapBoxComponent";
import { MapEventArgs } from "../../../Events/MapEventArgs";
import { MapBoxDrawService } from "./MapBoxDrawService";
import * as turf from "@turf/helpers";

export class MapBoxGeometryDrawing implements IGeometryDrawing {
	private draw;
	private readonly DRAW_FINISH_EVENT = "draw.create";

	constructor(private mapComponent: MapBoxComponent) {
		MapBoxDrawService.initialize(this.mapComponent);
		this.draw = MapBoxDrawService.getDrawLibraryInstance();
	}

	public async drawPoint(design?: IGeometryDesign, token?: IActionToken): Promise<Point> {
		const coordinate: Coordinate = await this.samplePoint(token);
		return this.mapComponent.geometryBuilder.buildPoint(coordinate, design);
	}

	public async drawLine(design?: IGeometryDesign, token?: IActionToken): Promise<Line> {
		const coordinates: Coordinate[] = await this.sampleLine(token);
		return this.mapComponent.geometryBuilder.buildLine(coordinates, design);
	}

	public async drawArrow(design?: IArrowGeometryDesign, token?: IActionToken): Promise<Arrow> {
		const coordinates: Coordinate[] = await this.sampleLine(token);
		return this.mapComponent.geometryBuilder.buildArrow(coordinates, design);
	}

	public async drawPolygon(design?: IGeometryDesign, token?: IActionToken): Promise<Polygon> {
		const coordinates: Coordinate[] = await this.samplePolygon(token);
		return this.mapComponent.geometryBuilder.buildPolygon(coordinates, design);
	}

	public async drawDoubleLine(design?: IDoubleLineGeometryDesign, token?: IActionToken): Promise<DoubleLine> {
		const coordinates: Coordinate[] = await this.sampleLine(token);
		return this.mapComponent.geometryBuilder.buildDoubleLine(coordinates, design);
	}

	public async drawRectangle(design?: IGeometryDesign, token?: IActionToken): Promise<Polygon> {
		const coordinates: Coordinate[] = await this.sampleRectangle(token);
		const poly: Polygon = this.mapComponent.geometryBuilder.buildPolygon(coordinates, design);
		return poly;
	}

	private async samplePoint(token?: IActionToken): Promise<Coordinate> {
		const geometry = await this.sampleGeometry(this.draw.modes.DRAW_POINT, token) as GeoJSON.Point;
		return Coordinate.fromGeoJSON(geometry.coordinates);
	}

	private async sampleLine(token?: IActionToken): Promise<Coordinate[]> {
		const geometry = await this.sampleGeometry(this.draw.modes.DRAW_LINE_STRING, token) as GeoJSON.LineString;
		return geometry.coordinates.map(geoJsonCoord => Coordinate.fromGeoJSON(geoJsonCoord));
	}

	private async samplePolygon(token?: IActionToken): Promise<Coordinate[]> {
		const geometry = await this.sampleGeometry(this.draw.modes.DRAW_POLYGON, token) as GeoJSON.Polygon;
		return geometry.coordinates[0].map(geoJsonCoord => Coordinate.fromGeoJSON(geoJsonCoord));
	}

	private sampleGeometry(mode: string, token?: IActionToken): Promise<GeoJSON.Geometry> {
		return new Promise<GeoJSON.Geometry>((resolve, reject) => {
			const mapContainer: HTMLElement = this.mapComponent.nativeMapInstance.getCanvasContainer();
			mapContainer.style.cursor = "crosshair";
			const createdCallback = (event) => {
				this.draw.delete(event.features[0].id);
				mapContainer.style.cursor = "default";
				removeDrawMarker();
				resolve(event.features[0].geometry);
			};
			this.draw.changeMode(mode);

			const removeDrawMarker = this.addMakerOnDrawMove();

			this.mapComponent.nativeMapInstance.once(this.DRAW_FINISH_EVENT, createdCallback);

			if (token) {
				token.cancel = (): void => {
					this.draw.deleteAll();
					this.mapComponent.nativeMapInstance.off(this.DRAW_FINISH_EVENT, createdCallback);
					reject();
				};
			}
		});
	}

	private addMakerOnDrawMove(): () => void {
		let marker: Point;
		const markerListener = (event: MapEventArgs) => {
			const coordinate = new Coordinate(event.latitude, event.longitude);
			const design: IGeometryDesign = {
				icons: [{
					image: {
						visibility: true,
					}
				}]
			};
			if (!marker) {
				marker = this.mapComponent.geometryBuilder.buildPoint(coordinate, design);
				marker.addToMap();
			} else {
				marker.setCoordinate(coordinate);
			}
		};
		this.mapComponent.on("mousemove", markerListener);

		return () => {
			this.mapComponent.off("mousemove", markerListener);
			marker.remove();
		};
	}

	private sampleRectangle(token?: IActionToken): Promise<Coordinate[]> {
		return new Promise<Coordinate[]>((resolve, reject) => {
			let geoJsonPolygon: GeoJSON.Feature<GeoJSON.Polygon>;
			let drawLayer: mapboxgl.Layer = {
				id: "rectangle-drawing",
				paint: {
					"fill-color": "orange",
					"fill-opacity": 0.2,
					"fill-outline-color": "orange"
				}
			};
			let firstPoint: mapboxgl.LngLat;

			const startCallback = (event: mapboxgl.MapMouseEvent) => {
				this.mapComponent.nativeMapInstance.dragPan.disable();
				firstPoint = event.lngLat;
				this.mapComponent.nativeMapInstance.on("mousemove", moveCallback);
			};

			const moveCallback = (event: mapboxgl.MapMouseEvent) => {
				geoJsonPolygon = turf.polygon([[
					firstPoint.toArray(),
					[firstPoint.lng, event.lngLat.lat],
					event.lngLat.toArray(),
					[event.lngLat.lng, firstPoint.lat],
					firstPoint.toArray()
				]]);
				drawLayer = this.mapComponent.geometryUtils
					.generateGeoJsonShape(geoJsonPolygon, "fill", drawLayer);

				if (!this.mapComponent.nativeMapInstance.getLayer(drawLayer.id)) {
					this.mapComponent.nativeMapInstance.addLayer(drawLayer);
					this.mapComponent.nativeMapInstance.once("mouseup", finishCallback);
				}
			};
			const finishCallback = () => {
				removeDrawTraces();
				const coordinates = geoJsonPolygon.geometry.coordinates[0].map(geojsonCoord => Coordinate.fromGeoJSON(geojsonCoord));
				resolve(coordinates);
			};

			const removeDrawTraces = () => {
				if (drawLayer) {
					this.mapComponent.nativeMapInstance.removeLayer(drawLayer.id);
					this.mapComponent.nativeMapInstance.removeSource(drawLayer.id);
				}
				this.mapComponent.nativeMapInstance.off("mousedown", startCallback);
				this.mapComponent.nativeMapInstance.off("mousemove", moveCallback);
				this.mapComponent.nativeMapInstance.off("mouseup", finishCallback);

				this.mapComponent.nativeMapInstance.dragPan.enable();
			};

			this.mapComponent.nativeMapInstance.once("mousedown", startCallback);

			if (token) {
				token.cancel = (): void => {
					removeDrawTraces();
					reject();
				};
			}
		});
	}
}