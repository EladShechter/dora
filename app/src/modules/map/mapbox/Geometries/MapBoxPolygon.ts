import { IActionToken } from "../../Common/IActionToken";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { Coordinate } from "../../Geometries/Coordinate";
import { Polygon } from "../../Geometries/Polygon";
import { FillPatternName, LinePatternName } from "../../GeometryDesign/Enums";
import { MapBoxComponent } from "../MapBoxComponent";
import { MapBoxGraphicsUtils } from "./MapBoxGraphicsUtils";
import { MapBoxLayer } from "./MapBoxLayer";
import { MapBoxFillPatternCreator } from "./patterns/MapBoxFillPatternCreator";
import { MapBoxLinePatternCreator } from "./patterns/MapBoxLinePatternCreator";
import * as mapboxgl from "mapbox-gl";
import * as turf from "@turf/helpers";

export class MapBoxPolygon extends Polygon {
	protected geometryOnMap: mapboxgl.Layer[];
	protected fillGeometry: mapboxgl.Layer;
	protected outlineGeometry: mapboxgl.Layer;
	protected mapComponent: MapBoxComponent;

	constructor(mapComponent: MapBoxComponent,
		coordinates: Coordinate[] | Coordinate[][],
		design?: IGeometryDesign,
		id?: string) {
		super(mapComponent, coordinates, design, id);
		this.graphicsUtils = new MapBoxGraphicsUtils(mapComponent);
	}

	public dispose(): void {
		this.geometryOnMap.forEach(layer => {
			this.mapComponent.nativeMapInstance.removeSource(layer.id);
		});
		this.geometryOnMap = null;
	}

	public edit(token: IActionToken): void {
		this.setVisibility(false);
		this.mapComponent.geometryDragging.startEditGeometry(this);

		const exitEditMode = () => {
			this.mapComponent.geometryDragging.exitEditMode();
			this.setVisibility(true);
		};

		token.finish = () => {
			this.setGeoJSON(this.mapComponent.geometryDragging.getNewGeoJsonFeature());
			exitEditMode();
		};

		token.cancel = () => {
			exitEditMode();
		};
	}

	public drag(token: IActionToken): void {
		this.setVisibility(false);
		this.mapComponent.geometryDragging.startDragGeometry(this);

		const exitDragMode = () => {
			this.mapComponent.geometryDragging.exitDragMode();
			this.setVisibility(true);
		};

		token.finish = () => {
			this.setGeoJSON(this.mapComponent.geometryDragging.getNewGeoJsonFeature());
			exitDragMode();
		};

		token.cancel = () => {
			exitDragMode();
		};
	}

	public setVisibility(state: boolean): void {
		this.geometryOnMap.forEach(layer => {
			this.mapComponent.geometryUtils.setGeometryVisibility(layer, state);
		});

		this.iconPoints.forEach(iconPoint => {
			iconPoint.setVisibility(state);
		});
		this.visible = state;
	}

	public openBalloonHtml(html: string): void {
		const baloonCoordinate = this.calculateBalloonOpenPosition();
		this.mapComponent.geometryUtils.openBalloonHtml(baloonCoordinate, html);
	}

	public setId(value: string): void {
		this.id = value;
	}

	public getId(): string {
		return this.id;
	}


	protected addNativeGeometryToMap(): void {
		this.geometryOnMap.forEach(layer => {
			this.mapComponent.nativeMapInstance.addLayer(layer);
		});
	}

	protected removeNativeGeometryFromMap(): void {
		this.geometryOnMap.forEach(layer => {
			this.mapComponent.nativeMapInstance.removeLayer(layer.id);
		});
	}

	protected addNativeGeometryToLayer(layer: MapBoxLayer): void {
		this.geometryOnMap.forEach(l => {
			layer.addNativeGeometryToMap(l);
		});
	}

	protected removeNativeGeometryFromLayer(layer: MapBoxLayer): void {
		this.geometryOnMap.forEach(l => {
			layer.removeNativeGeometryFromMap(l, this.addedToMap, this.addedToLayers);
		});
	}

	protected generateGeometryOnMap() {
		this.applyTransformations();
		const geoJsonPolygonFeature = this.getTransformedGeoJSONFeature();

		if (this.design.fill && this.design.fill.pattern !== FillPatternName.Empty) {
			this.fillGeometry = this.mapComponent.geometryUtils
				.generateGeoJsonShape(geoJsonPolygonFeature, "fill", this.fillGeometry);
		} else if (this.fillGeometry) {
			this.mapComponent.nativeMapInstance.removeLayer(this.fillGeometry.id);
			delete this.fillGeometry;
		}

		const geoJsonLineFeature = turf.lineString(geoJsonPolygonFeature.geometry.coordinates[0]);
		this.outlineGeometry = this.mapComponent.geometryUtils
			.generateGeoJsonShape(geoJsonLineFeature, "line", this.outlineGeometry);

		this.geometryOnMap = [this.fillGeometry, this.outlineGeometry]
			.filter(layer => !!layer);

		this.mapComponent.geometryUtils.applyAfterLayersAdded(this.geometryOnMap).then(() => {
			this.applyDesign(this.design);
		});

		this.generateIconsCoordinates();
	}

	protected applyDesign(design: IGeometryDesign) {
		super.applyDesign(design);
		if (this.isOnMap) {
			if (design.line && design.line.pattern) {
				this.setLinePattern(design.line.pattern, design.line.color, design.line.width);
			}
			if (design.fill && design.fill.pattern) {
				this.setFillPattern(design.fill.pattern, design.fill.color);
			}
		}
	}

	protected initializeOrCleanGeometryOnMap(): mapboxgl.Layer {
		throw "";
	}

	protected initializeSubGeometryOnMap(geometry: mapboxgl.Layer): mapboxgl.Layer {
		throw "";
	}

	protected addSubGeometriesToGeometryOnMap(geometries: mapboxgl.Layer[]): void {
	}

	protected createNativeMultiPolyline(group, coordinatesMat: Coordinate[][]): void {
	}

	protected createNativeMultiPolygon(group, coordinatesMat: Coordinate[][]): void {
	}

	protected createNativeOutlinePolygon(group, coordinatesMat: Coordinate[][]): void {
	}

	protected createNativeFillPolygon(group, coordinatesMat: Coordinate[][]): void {
	}

	protected createBackgroundFillPolygon(group, coordinatesMat: Coordinate[][]): void {
	}

	protected setLineColor(color: string): void {
		this.mapComponent.nativeMapInstance.setPaintProperty(
			this.outlineGeometry.id, "line-color", color);
	}

	protected setLineOpacity(opacity: number): void {
		this.mapComponent.nativeMapInstance.setPaintProperty(
			this.outlineGeometry.id, "line-opacity", opacity);
	}

	protected setLineWidth(width: number): void {
		this.mapComponent.nativeMapInstance.setPaintProperty(
			this.outlineGeometry.id, "line-width", width);
	}

	protected setFillColor(color: string): void {
		if (this.fillGeometry) {
			this.mapComponent.nativeMapInstance.setPaintProperty(
				this.fillGeometry.id, "fill-color", color);
		}
	}

	protected setFillOpacity(opacity: number): void {
		if (this.fillGeometry) {
			this.mapComponent.nativeMapInstance.setPaintProperty(
				this.fillGeometry.id, "fill-opacity", opacity);
		}
	}

	private setFillPattern(fillPattern: FillPatternName, fillColor: string): void {
		if (this.fillGeometry) {
			let patternImageName: string;
			if (fillPattern !== FillPatternName.Solid) {
				patternImageName = MapBoxFillPatternCreator.createFillPatternImage(
					this.mapComponent.nativeMapInstance, fillPattern, fillColor);
			}

			this.mapComponent.nativeMapInstance.setPaintProperty(
				this.fillGeometry.id, "fill-pattern", patternImageName);
		}
	}

	private setLinePattern(linePattern: LinePatternName, lineColor: string, lineWidth: number = 1): void {
		let patternImageName: string;

		if (linePattern !== LinePatternName.Solid) {
			const size = 16 * lineWidth;
			patternImageName = MapBoxLinePatternCreator.createLinePatternImage(
				this.mapComponent.nativeMapInstance, linePattern, lineColor, size);
			this.setLineWidth(size);
		}

		this.mapComponent.nativeMapInstance.setPaintProperty(
			this.outlineGeometry.id, "line-pattern", patternImageName);
	}

	protected addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.mapComponent.geometryUtils.addEntityMouseEventForMultipleLayers(listener, "click", this.geometryOnMap);
	}

	protected addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.mapComponent.geometryUtils.addEntityMouseEventForMultipleLayers(listener, "dblclick", this.geometryOnMap);
	}

	protected addContextMenuListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.mapComponent.geometryUtils.addEntityMouseEventForMultipleLayers(listener, "contextmenu", this.geometryOnMap);
	}

	protected addMouseOverListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.mapComponent.geometryUtils.addEntityMouseEventForMultipleLayers(listener, "mouseover", this.geometryOnMap);
	}

	protected addMouseOutListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.mapComponent.utils.addEntityMouseEvent(listener, "mouseout", this.fillGeometry);
	}
}