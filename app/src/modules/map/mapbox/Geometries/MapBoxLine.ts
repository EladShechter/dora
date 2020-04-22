import { IActionToken } from "../../Common/IActionToken";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { Coordinate } from "../../Geometries/Coordinate";
import { Line } from "../../Geometries/Line";
import { LinePatternName } from "../../GeometryDesign/Enums";
import { MapBoxGraphicsUtils } from "./MapBoxGraphicsUtils";
import { MapBoxLayer } from "./MapBoxLayer";
import { MapBoxComponent } from "../MapBoxComponent";
import { MapBoxLinePatternCreator } from "./patterns/MapBoxLinePatternCreator";
import * as turf from "@turf/helpers";
import * as mapboxgl from "mapbox-gl";

export class MapBoxLine extends Line {
	protected mapComponent: MapBoxComponent;
	protected geometryOnMap: mapboxgl.Layer;

	constructor(mapComponent: MapBoxComponent,
		coordinates: Coordinate[],
		design?: IGeometryDesign,
		id?: string) {
		super(mapComponent, coordinates, design, id);
		this.graphicsUtils = new MapBoxGraphicsUtils(mapComponent);
	}

	protected addNativeGeometryToMap(): void {
		this.mapComponent.nativeMapInstance.addLayer(this.geometryOnMap);
	}

	protected removeNativeGeometryFromMap(): void {
		this.mapComponent.nativeMapInstance.removeLayer(this.geometryOnMap.id);
	}

	public dispose(): void {
		this.mapComponent.nativeMapInstance.removeSource(this.geometryOnMap.id);
		this.geometryOnMap = null;
	}

	protected addNativeGeometryToLayer(layer: MapBoxLayer): void {
		layer.addNativeGeometryToMap(this.geometryOnMap);
	}

	protected removeNativeGeometryFromLayer(layer: MapBoxLayer): void {
		layer.removeNativeGeometryFromMap(this.geometryOnMap, this.addedToMap, this.addedToLayers);
	}

	protected generateGeometryOnMap(): void {
		this.applyTransformations();
		const geoJsonCoordinates = this.transformedCoordinates.map(coord => coord.getGeoJSON());
		const geoJsonGeometry = turf.lineString(geoJsonCoordinates);
		this.geometryOnMap = this.mapComponent.geometryUtils
			.generateGeoJsonShape(geoJsonGeometry, "line", this.geometryOnMap);

		this.mapComponent.geometryUtils.applyAfterLayerAdded(this.geometryOnMap).then(() => {
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
		}
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
		this.mapComponent.geometryUtils.setGeometryVisibility(this.geometryOnMap, state);
		this.iconPoints.forEach(iconPoint => {
			iconPoint.setVisibility(state);
		});
		this.visible = state;
	}

	public openBalloonHtml(html: string): void {
		const baloonCoordinate = this.calculateBalloonOpenPosition();
		this.mapComponent.geometryUtils.openBalloonHtml(baloonCoordinate, html);
	}

	protected setLineColor(color: string): void {
		this.mapComponent.nativeMapInstance.setPaintProperty(
			this.geometryOnMap.id, "line-color", color);
	}

	protected setLineOpacity(opacity: number): void {
		this.mapComponent.nativeMapInstance.setPaintProperty(
			this.geometryOnMap.id, "line-opacity", opacity);
	}

	protected setLineWidth(width: number): void {
		this.mapComponent.nativeMapInstance.setPaintProperty(
			this.geometryOnMap.id, "line-width", width);
	}

	protected setFillColor(color: string): void {
		// not relevant
	}

	protected setFillOpacity(opacity: number): void {
		// not relevant
	}

	protected addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.mapComponent.utils.addEntityMouseEvent(listener, "click", this.geometryOnMap);
	}

	protected addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.mapComponent.utils.addEntityMouseEvent(listener, "dblclick", this.geometryOnMap);
	}

	protected addContextMenuListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.mapComponent.utils.addEntityMouseEvent(listener, "contextmenu", this.geometryOnMap);
	}

	protected addMouseOverListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.mapComponent.utils.addEntityMouseEvent(listener, "mouseover", this.geometryOnMap);
	}

	protected addMouseOutListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.mapComponent.utils.addEntityMouseEvent(listener, "mouseout", this.geometryOnMap);
	}

	public setId(value: string): void {
		this.id = value;
	}

	public getId(): string {
		return this.id;
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
			this.geometryOnMap.id, "line-pattern", patternImageName);
	}
}