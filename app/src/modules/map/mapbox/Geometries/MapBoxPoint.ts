import { IActionToken } from "../../Common/IActionToken";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { IImageDesign } from "../../GeometryDesign/Interfaces/IImageDesign";
import { MapEventArgs } from "../../Events/MapEventArgs";
import { Coordinate } from "../../Geometries/Coordinate";
import { Point } from "../../Geometries/Point";
import { IIconDesign, ILabelDesign } from "../../GeometryDesign/Interfaces";
import { IconRelativePosition } from "../../GeometryDesign/Enums/IconRelativePosition";
import { LabelRelativePosition } from "../../GeometryDesign/Enums";
import { MapBoxComponent } from "../MapBoxComponent";
import { MapBoxGraphicsUtils } from "./MapBoxGraphicsUtils";
import { MapBoxLayer } from "./MapBoxLayer";
import * as turf from "@turf/helpers";
import * as mapboxgl from "mapbox-gl";

type size = { height: number, width: number; };
type position = { x: number; y: number; };
export class MapBoxPoint extends Point {
	private readonly DEFAULT_DESIGN: IIconDesign = {
		image: {
			url: require("../../../../../assets/placemark.png"),
			size: {
				height: 32, width: 32
			},
			anchor: {
				x: 16, y: 32
			},
			angle: 0,
			opacity: 1,
			positionPolicy: IconRelativePosition.Center
		},
		label: {
			text: "",
			opacity: 1,
			visibility: false,
			fontSize: 12,
			positionPolicy: LabelRelativePosition.Top
		}
	};
	private static loadedImages = new Map<string, ImageBitmap>();
	protected mapComponent: MapBoxComponent;
	protected geometryOnMap: mapboxgl.Layer;

	constructor(
		mapComponent: MapBoxComponent,
		coordinate: Coordinate,
		design?: IGeometryDesign,
		id?: string
	) {
		super(mapComponent, coordinate, design, id);
		this.graphicsUtils = new MapBoxGraphicsUtils(mapComponent);
	}

	public getId(): string {
		return this.id;
	}

	public setId(value: string): void {
		this.id = value;
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
		layer.addNativeGeometryToMap(this.geometryOnMap, this.getGeoJSON());
	}

	protected removeNativeGeometryFromLayer(layer: MapBoxLayer): void {
		layer.removeNativeGeometryFromMap(this.geometryOnMap, this.addedToMap, this.addedToLayers);
	}

	protected generateGeometryOnMap(): void {
		const geoJson = turf.point(this.coordinate.getGeoJSON());
		this.geometryOnMap = this.mapComponent.geometryUtils
			.generateGeoJsonShape(geoJson, "symbol", this.geometryOnMap);

		this.mapComponent.geometryUtils.applyAfterLayerAdded(this.geometryOnMap).then(() => {
			this.applyDesign(this.design);
		});

		this.addedToLayers.forEach((layer: MapBoxLayer) => {
			layer.addNativeGeometryToMap(this.geometryOnMap, this.getGeoJSON());
		});
	}

	public edit(token: IActionToken): void {
		this.drag(token);
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

	protected async renderIcon(): Promise<void> {
		const iconDesign = this.getIconDesign();
		let iconProperties: { iconSize: size, iconAnchor: position; };
		if (iconDesign.image) {
			iconProperties = await this.renderImageDesign(iconDesign.image);
		}

		if (iconDesign.label) {
			this.renderLabel(iconDesign.label, iconProperties);
		}
	}

	private getIconDesign(): IIconDesign {
		if (this.design.icons[0]) {
			return this.design.icons[0];
		}
		else {
			return this.DEFAULT_DESIGN;
		}

	}

	private async renderImageDesign(imageDesign: IImageDesign): Promise<{ iconSize: size, iconAnchor: position; }> {
		if (imageDesign.visibility) {
			const imageUrl = await this.setImageUrl(imageDesign.url);
			const iconSize = this.setIconSize(imageDesign.size, imageUrl);
			const iconAnchor = this.setIconAnchor(imageDesign.anchor, iconSize);
			this.setIconOpacity(imageDesign.opacity);
			this.setIconAngle(imageDesign.angle);

			return {
				iconSize, iconAnchor
			};
		} else {
			this.setIconOpacity(0);
		}
	}

	private async setImageUrl(imageUrl: string): Promise<string> {
		imageUrl = imageUrl || this.DEFAULT_DESIGN.image.url;
		await this.loadImage(imageUrl);
		this.mapComponent.nativeMapInstance
			.setLayoutProperty(this.geometryOnMap.id, "icon-image", imageUrl);
		return imageUrl;
	}

	private loadImage(imageUrl: string): Promise<void> {
		const map = this.mapComponent.nativeMapInstance;
		return new Promise((resolve, reject) => {
			if (!map.hasImage(imageUrl)) {
				map.loadImage(imageUrl, (error: Error, image) => {
					if (error) {
						reject(error);
					}
					else {
						// this condition repeat because we in async function
						if (!map.hasImage(imageUrl)) {
							map.addImage(imageUrl, image);
							MapBoxPoint.loadedImages.set(imageUrl, image);
						}
						resolve();
					}
				});
			}
			else {
				resolve();
			}
		});
	}

	private renderLabel(labelDesign: ILabelDesign, iconProperties: { iconSize: size, iconAnchor: position; }) {
		if (labelDesign.text && labelDesign.visibility) {
			this.mapComponent.nativeMapInstance
				.setLayoutProperty(this.geometryOnMap.id, "text-font", ["Klokantech Noto Sans Regular"]);
			this.setLabel(labelDesign.text);
			this.setLabelOpacity(labelDesign.opacity);
			this.setLabelSize(labelDesign.fontSize);
			this.setLabelPosition(labelDesign.positionPolicy, iconProperties);
		} else {
			this.setLabel("");
		}
	}

	private setIconSize(size: size, imageUrl: string): size {
		size = size || this.DEFAULT_DESIGN.image.size;
		const nativeSize: ImageBitmap = MapBoxPoint.loadedImages.get(imageUrl);
		const widthFactor = size.width / nativeSize.width;
		const heightFactor = size.height / nativeSize.height;

		const averageFactor = (widthFactor + heightFactor) / 2;

		this.mapComponent.nativeMapInstance
			.setLayoutProperty(this.geometryOnMap.id, "icon-size", averageFactor);
		return { width: nativeSize.width * averageFactor, height: nativeSize.height * averageFactor };
	}

	/**
	 * calculate approximation of mapbox relative origin from anchor of dora's image design.
	 * if the x value is less than a quarter of the image size the vertical value is TOP
	 * if the x value is more than a three quarter of the image size the vertical value is BOTTOM
	 * otherwise is CENTER
	 * if the y value is less than a quarter of the image size the vertical value is LEFT
	 * if the y value is more than a three quarter of the image size the vertical value is RIGHT
	 * otherwise is CENTER
	 */
	private setIconAnchor(anchor: position, size: size): position {
		anchor = anchor || { x: size.width / 2, y: size.height }; // default - center bottom

		const heightRatio: number = anchor.y / size.height;
		const widthRatio: number = anchor.x / size.width;
		const QUARTER: number = 0.25;
		const THREE_QUARTERS: number = 0.75;
		const CENTER = "center";

		let vertical: string = CENTER;
		let horizontal: string = CENTER;

		if (heightRatio < QUARTER) {
			vertical = "top";
		}
		else if (heightRatio > THREE_QUARTERS) {
			vertical = "bottom";
		}

		if (widthRatio < QUARTER) {
			horizontal = "left";
		}
		else if (widthRatio > THREE_QUARTERS) {
			horizontal = "right";
		}

		let mapboxAnchorProperty: string;
		if (vertical === CENTER && horizontal === CENTER) {
			mapboxAnchorProperty = CENTER;
		}
		else if (vertical === CENTER) {
			mapboxAnchorProperty = horizontal;
		}
		else if (horizontal === CENTER) {
			mapboxAnchorProperty = vertical;
		}
		else {
			mapboxAnchorProperty = `${ vertical }-${ horizontal }`;
		}

		this.mapComponent.nativeMapInstance
			.setLayoutProperty(this.geometryOnMap.id, "icon-anchor", mapboxAnchorProperty);

		return anchor;
	}

	private setIconOpacity(opacity: number) {
		opacity = typeof (opacity) === "number" ? opacity : this.DEFAULT_DESIGN.image.opacity;
		this.mapComponent.nativeMapInstance
			.setPaintProperty(this.geometryOnMap.id, "icon-opacity", opacity);
	}

	private setIconAngle(angle: number) {
		angle = typeof (angle) === "number" ? angle : this.DEFAULT_DESIGN.image.angle;
		this.mapComponent.nativeMapInstance
			.setLayoutProperty(this.geometryOnMap.id, "icon-rotate", angle);
	}

	public setVisibility(state: boolean): void {
		this.mapComponent.geometryUtils.setGeometryVisibility(this.geometryOnMap, state);
		this.visible = state;
	}

	public setLabel(label: string): void {
		this.mapComponent.nativeMapInstance
			.setLayoutProperty(this.geometryOnMap.id, "text-field", label);
	}

	private setLabelOpacity(opacity: number) {
		opacity = typeof (opacity) === "number" ? opacity : this.DEFAULT_DESIGN.label.opacity;
		this.mapComponent.nativeMapInstance
			.setPaintProperty(this.geometryOnMap.id, "text-opacity", opacity);
	}
	private setLabelSize(size: number) {
		size = typeof (size) === "number" ? size : this.DEFAULT_DESIGN.label.fontSize;
		this.mapComponent.nativeMapInstance
			.setLayoutProperty(this.geometryOnMap.id, "text-size", size);
	}

	private setLabelPosition(
		positionPolicy: LabelRelativePosition,
		iconProperties: { iconSize: size, iconAnchor: position; }) {

		if (positionPolicy) {
			const positionPolicyValidOptions = [
				LabelRelativePosition.Bottom,
				LabelRelativePosition.Top,
				LabelRelativePosition.Right,
				LabelRelativePosition.Left
			];
			if (!positionPolicyValidOptions.includes(positionPolicy)) {
				throw new Error("The position policy is not valid. should be Top/Bottom/Right/Left");
			}
			if (iconProperties) {
				this.moveAnchorForLabelToBeOutsideOfIcon(positionPolicy, iconProperties.iconSize, iconProperties.iconAnchor);
			}

			this.setPlaceInLabelCloseToAnchor(positionPolicy);
		}
	}

	private moveAnchorForLabelToBeOutsideOfIcon(
		positionPolicy: LabelRelativePosition,
		iconSize: size,
		iconAnchor: position) {

		const iconCenter = { x: iconSize.width / 2, y: iconSize.height / 2 };
		const iconCenterRelativeToAnchor = {
			x: iconCenter.x - iconAnchor.x,
			y: iconCenter.y - iconAnchor.y
		};
		const outsideIconOffsetsByDirectionDict = {
			Bottom: [iconCenterRelativeToAnchor.x, iconCenterRelativeToAnchor.y + iconCenter.y],
			Top: [iconCenterRelativeToAnchor.x, iconCenterRelativeToAnchor.y - iconCenter.y],
			Right: [iconCenterRelativeToAnchor.x + iconCenter.x, iconCenterRelativeToAnchor.y],
			Left: [iconCenterRelativeToAnchor.x - iconCenter.x, iconCenterRelativeToAnchor.y]
		};

		this.mapComponent.nativeMapInstance
			.setPaintProperty(this.geometryOnMap.id, "text-translate",
				outsideIconOffsetsByDirectionDict[positionPolicy]);
	}

	private setPlaceInLabelCloseToAnchor(positionPolicy: LabelRelativePosition) {
		const textAnchorsByDirectionDict = {
			Bottom: "top",
			Top: "bottom",
			Right: "left",
			Left: "right"
		};

		this.mapComponent.nativeMapInstance
			.setLayoutProperty(this.geometryOnMap.id, "text-anchor", textAnchorsByDirectionDict[positionPolicy]);
	}

	public openBalloonHtml(html: string): void {
		this.mapComponent.geometryUtils.openBalloonHtml(this.coordinate, html);
	}

	protected addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.mapComponent.utils.addEntityMouseEvent(listener, "click", this.geometryOnMap);
	}

	protected addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.mapComponent.utils.addEntityMouseEvent(listener, "dblclick", this.geometryOnMap);
	}

	protected addMouseOverListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.mapComponent.utils.addEntityMouseEvent(listener, "mouseover", this.geometryOnMap);
	}

	protected addMouseOutListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.mapComponent.utils.addEntityMouseEvent(listener, "mouseout", this.geometryOnMap);
	}

	protected addContextMenuListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.mapComponent.utils.addEntityMouseEvent(listener, "contextmenu", this.geometryOnMap);
	}
}
