import { IActionToken } from "../../Common/IActionToken";
import { IArrowGeometryDesign } from "../../GeometryDesign/Interfaces/IArrrowGeometryDesign";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { Arrow } from "../../Geometries/Arrow";
import { Coordinate } from "../../Geometries/Coordinate";
import { LinePatternName, ArrowType } from "../../GeometryDesign/Enums";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces";
import { MapBoxLinePatternCreator } from "./patterns/MapBoxLinePatternCreator";
import { MapBoxComponent } from "../MapBoxComponent";
import { MapBoxGraphicsUtils } from "./MapBoxGraphicsUtils";
import { MapBoxLayer } from "./MapBoxLayer";
import * as mapboxgl from "mapbox-gl";
import * as turf from "@turf/helpers";
import turfBearing from "@turf/bearing";

export class MapBoxArrow extends Arrow {
	protected mapComponent: MapBoxComponent;
	protected geometryOnMap: mapboxgl.Layer[];
	protected mainLineLayer: mapboxgl.Layer;
	protected arrowHead: mapboxgl.Layer;
	private readonly GAP_DIVISION_TO_PIXEL = 50;
	private readonly DEFAULT_GAP = 500;
	private readonly ARROW_ICON_SIZE = 30;

	constructor(mapComponent: MapBoxComponent,
		coordinates: Coordinate[],
		design?: IArrowGeometryDesign,
		id?: string) {
		super(mapComponent, coordinates, design, id);
		this.graphicsUtils = new MapBoxGraphicsUtils(mapComponent);
	}

	protected addNativeGeometryToMap(): void {
		this.geometryOnMap.forEach(l => {
			this.mapComponent.nativeMapInstance.addLayer(l);
		});
	}

	protected removeNativeGeometryFromMap(): void {
		this.geometryOnMap.forEach(l => {
			this.mapComponent.nativeMapInstance.removeLayer(l.id);
		});
	}

	public dispose(): void {
		this.geometryOnMap.forEach(l => {
			this.mapComponent.nativeMapInstance.removeSource(l.id);
		});
		this.geometryOnMap = null;
		this.mainLineLayer = null;
		this.arrowHead = null;
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

	protected generateGeometryOnMap(): void {
		this.applyTransformations();
		this.geometryOnMap = [];

		this.generateMainLineLayer();
		this.generateArrowHeadLayer();

		this.mapComponent.geometryUtils.applyAfterLayersAdded(this.geometryOnMap).then(() => {
			this.applyDesign(this.design);
		});

		this.generateIconsCoordinates();
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
		this.geometryOnMap.forEach(l => {
			this.mapComponent.geometryUtils.setGeometryVisibility(l, state);
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

	protected setLineColor(color: string): void {
		this.geometryOnMap.forEach(l => {
			if (l.type === "line") {
				this.mapComponent.nativeMapInstance.setPaintProperty(
					l.id, "line-color", color);
			}
		});
	}

	protected setLineOpacity(opacity: number): void {
		this.geometryOnMap.forEach(l => {
			if (l.type === "line") {
				this.mapComponent.nativeMapInstance.setPaintProperty(
					l.id, "line-opacity", opacity);
			}
		});
	}

	protected setLineWidth(width: number): void {
		this.geometryOnMap.forEach(l => {
			if (l.type === "line") {
				this.mapComponent.nativeMapInstance.setPaintProperty(
					l.id, "line-width", width);
			}
		});
	}

	protected setFillColor(color: string): void {
		// not relevant
	}

	protected setFillOpacity(opacity: number): void {
		// not relevant
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
		return this.mapComponent.geometryUtils.addEntityMouseEventForMultipleLayers(listener, "mouseout", this.geometryOnMap);
	}

	public setId(value: string): void {
		this.id = value;
	}
	public getId(): string {
		return this.id;
	}

	public setDesign(design: IArrowGeometryDesign): void {
		this.design.update(design);
		this.generateGeometryOnMap();
		this.applyDesign(this.design);
		this.setIconsOnPathDesign(design);
	}

	protected applyDesign(design: IGeometryDesign) {
		super.applyDesign(design);
		if (this.isOnMap) {
			if (design.line && design.line.pattern) {
				this.setLinePattern(design.line.pattern, design.line.color, design.line.width);
			}
		}
	}

	private setLinePattern(linePattern: LinePatternName, lineColor: string, lineWidth: number = 1): void {
		let patternImageName: string;

		if (linePattern !== LinePatternName.Solid) {
			const size = 16 * lineWidth;
			patternImageName = MapBoxLinePatternCreator.createLinePatternImage(
				this.mapComponent.nativeMapInstance, linePattern, lineColor, size);
			this.mapComponent.nativeMapInstance.setPaintProperty(
				this.mainLineLayer.id, "line-width", size);
		}

		this.mapComponent.nativeMapInstance.setPaintProperty(
			this.mainLineLayer.id, "line-pattern", patternImageName);
	}

	private generateMainLineLayer() {
		let mainGeoJsonLine: GeoJSON.FeatureCollection | GeoJSON.Feature;
		if (this.design.arrow.type === ArrowType.Expanded) {
			const mainGeoJsonCoords = this.mainLinesCoordinates.map((coords: Coordinate[]) =>
				coords.map(c => c.getGeoJSON())
			);
			mainGeoJsonLine = turf.lineStrings(mainGeoJsonCoords);
		} else {
			const mainGeoJsonCoords = this.transformedCoordinates.map(c => c.getGeoJSON());
			mainGeoJsonLine = turf.lineString(mainGeoJsonCoords);
		}

		this.setGapWidthForWideArrow();

		this.mainLineLayer = this.mapComponent.geometryUtils.generateGeoJsonShape(mainGeoJsonLine, "line", this.mainLineLayer);

		this.geometryOnMap.push(this.mainLineLayer);
	}

	private setGapWidthForWideArrow() {
		if (this.design.arrow.type === ArrowType.Wide) {
			this.mainLineLayer = this.mainLineLayer || {} as any;
			this.mainLineLayer.paint = this.mainLineLayer.paint || {};
			this.mainLineLayer.paint["line-gap-width"] = this.design.arrow.gap / this.GAP_DIVISION_TO_PIXEL;
		} else if (this.mainLineLayer && this.mainLineLayer.paint && this.mainLineLayer.paint["line-gap-width"]) {
			this.mainLineLayer.paint["line-gap-width"] = undefined;
		}
	}

	private generateArrowHeadLayer() {
		const existLayer = this.arrowHead && this.mapComponent.nativeMapInstance.getLayer(this.arrowHead.id);
		let needToChangeLayer: boolean;
		const removePreviousLayer = () => {
			this.mapComponent.nativeMapInstance.removeLayer(existLayer.id);
			this.mapComponent.nativeMapInstance.removeSource(existLayer.id);
			delete this.arrowHead;
			this.geometryOnMap.splice(1, 1);
		};
		if (this.design.arrow.type === ArrowType.Expanded) {
			needToChangeLayer = existLayer && existLayer.type !== "line";
			needToChangeLayer && removePreviousLayer();

			const headGeoJsonCoords = this.arrowHeadsCoordinates.map((coords: Coordinate[]) =>
				coords.map(c => c.getGeoJSON())
			);
			const headGeoJsonLines = turf.lineStrings(headGeoJsonCoords);
			this.arrowHead = this.mapComponent.geometryUtils.generateGeoJsonShape(headGeoJsonLines, "line", this.arrowHead);
			this.geometryOnMap.push(this.arrowHead);
		} else {
			needToChangeLayer = existLayer && existLayer.type !== "symbol";
			needToChangeLayer && removePreviousLayer();
			this.generateArrowHeadSymbolLayer();
		}

		if (needToChangeLayer) {
			this.mapComponent.nativeMapInstance.addLayer(this.arrowHead);
		}
	}

	private generateArrowHeadSymbolLayer() {
		let headGeoJson: GeoJSON.Feature | GeoJSON.FeatureCollection = this.getHeadCoordinateGeoJson(this.baseCoordinates);
		if (this.design.arrow.isDouble) {
			const reversedCoodinates = this.baseCoordinates.slice().reverse();
			let tailGeoJson = this.getHeadCoordinateGeoJson(reversedCoodinates);
			headGeoJson = {
				type: "FeatureCollection",
				features: [headGeoJson, tailGeoJson]
			};
		}

		const arrowImage = this.createArrowHeadImage(
			this.design.arrow.type, this.design.line.color, this.design.line.width, this.design.arrow.gap);
		const headId = `arrowHead-${ this.mainLineLayer.id }`;
		this.arrowHead = {
			id: headId,
			paint: {
				"icon-opacity": this.design.line.opacity
			},
			layout: {
				"icon-image": arrowImage,
				"icon-anchor": (this.design.arrow.type === ArrowType.Regular) ? "top" : "bottom",
				"icon-rotate": ["get", "bearing"],
				"icon-allow-overlap": true,
				"icon-rotation-alignment": "map"
			}
		};

		this.arrowHead = this.mapComponent.geometryUtils.generateGeoJsonShape(headGeoJson, "symbol", this.arrowHead);
		this.geometryOnMap.push(this.arrowHead);
	}

	private getHeadCoordinateGeoJson(lineCoordinates: Coordinate[]): GeoJSON.Feature<GeoJSON.Point> {
		const coordinateForHead = lineCoordinates[lineCoordinates.length - 1].getGeoJSON();
		const coordinateBeforeHead = lineCoordinates[lineCoordinates.length - 2].getGeoJSON();

		const headGeoJson = turf.point(coordinateForHead);
		const bearing = turfBearing(coordinateBeforeHead, coordinateForHead);
		headGeoJson.properties["bearing"] = bearing;

		return headGeoJson;
	}

	private createArrowHeadImage(
		headName: ArrowType,
		color: string,
		width: number,
		gap: number = this.DEFAULT_GAP): string {

		let size = this.ARROW_ICON_SIZE;

		if (headName === ArrowType.Wide) {
			const gapInPixels = gap / this.GAP_DIVISION_TO_PIXEL;
			size = gapInPixels * 2.5;
			size = Math.max(size, 15);
		}

		const imagePatternName = `arrow-${ headName }-${ color }-${ width }-${ gap }`;
		if (!this.mapComponent.nativeMapInstance.hasImage(imagePatternName)) {
			const canvas = document.createElement("canvas");
			canvas.height = size;
			canvas.width = size;
			var ctx = canvas.getContext("2d");
			ctx.strokeStyle = color;
			ctx.lineWidth = width;

			if (headName === ArrowType.Regular) {
				this.createSimpleArrowHeadShape(ctx, size);
			} else {
				this.createComplexArrowHeadShape(ctx, size);
			}
			ctx.stroke();

			const imageData = ctx.getImageData(0, 0, size, size);
			this.mapComponent.nativeMapInstance.addImage(imagePatternName, imageData);
		}
		return imagePatternName;
	}

	private createSimpleArrowHeadShape(ctx: CanvasRenderingContext2D, size: number) {
		ctx.moveTo(0, size);
		ctx.lineTo(size * 0.5, 0);
		ctx.lineTo(size, size);
	}

	private createComplexArrowHeadShape(ctx: CanvasRenderingContext2D, size: number) {
		ctx.moveTo(size * 0.3, size);
		ctx.lineTo(0, size);
		ctx.lineTo(size * 0.5, 0);
		ctx.lineTo(size, size);
		ctx.lineTo(size * 0.7, size);
	}
}