import { MapEventArgs } from "../Events/MapEventArgs";
import { Coordinate } from "../Geometries/Coordinate";
import { RasterInfo } from "../Utilities/RasterInfo";
import { MapComponent } from "../Components/MapComponent";
import { IViewBounds } from "../Components/View/IViewBounds";
import { ViewBounds } from "../Components/View/ViewBounds";
import { IBaseLayer } from "../OverlayLayers/IBaseLayer";
import { IKMLGeometryCollection } from "../Geometries/IKMLGeometryCollection";
import { MapType } from "../../MapType";
import { MapBoxConfig } from "./MapBoxConfig";
import { IMapBoxConfig } from "./IMapBoxConfig";
import { MapBoxUtilties } from "./MapBoxUtilities";
import { MapUtils } from "../MapUtils/MapUtils";
import { MapBoxGeometryBuilder } from "./Geometries/MapBoxGeometryBuilder";
import { MapBoxGeometryDrawing } from "./Geometries/DrawEditDrag/MapBoxGeometryDrawing";
import { MapBoxGeometryUtils } from "./Geometries/MapBoxGeometryUtils";
import { MapBoxGeometryDragEdit } from "./Geometries/DrawEditDrag/MapBoxGeometryDragEdit";
import { MapBoxStyle } from "./MapBoxStyle";
import * as mapboxgl from "mapbox-gl";
import * as mapboxgl_rtl_text from "@mapbox/mapbox-gl-rtl-text/mapbox-gl-rtl-text.min.js";
import "mapbox-gl/dist/mapbox-gl.css";
import { Mapbox3DTiles } from "./Mapbox3DTiles";


export class MapBoxComponent extends MapComponent {
	private readonly FLY_DURATION = 1500;

	public geometryUtils: MapBoxGeometryUtils;
	public geometryDragging: MapBoxGeometryDragEdit;

	/**
	 * Class internal property for mapbox map instance.
	 */
	protected map: mapboxgl.Map;

	/**
	 * **The mapboxgl native map type** used on background.
	 * @throws Whether can not load map library object from dependencies.
	 */
	public get mapLibraryObject(): typeof mapboxgl {
		// mapboxgl is the library object of mapbox-gl
		return mapboxgl;
	}

	/**
	 * Initialize mapbox map instance.
	 * **Used by guest systems. Host systems will use the .load function**
	 * @param {mapboxgl.Map} mapInstance - An actual mapbox map instance [any due to abstraction design]. Cannot set as undefined/null.
	 * @throws Whether:
	 * 1. Invalid map-instance object.
	 * 2. When map-instance already exist.
	 */
	public initNativeMapInstance(mapInstance: mapboxgl.Map): void {
		// Check if given 'mapInstance' is undefined/null or not instance of map-instance
		if (!mapInstance) {
			throw new TypeError("Invalid type for mapbox's map-instance.");
		}

		// Check whether map already initialized
		if (this.map) {
			throw new Error("mapbox map-instance already initialized");
		}

		this.map = mapInstance;
	}

	/**
	 * **The mapboxgl** actual map's instance.
	 * @returns {mapboxgl.Map} mapboxgl map instance
	 * @throws When native map instance has not initialized.
	 */
	public get nativeMapInstance(): mapboxgl.Map {
		// Check whether map-instance initialize
		if (this.map) {
			return this.map;
		}

		throw new Error("mapbox map-instance does not initialize");
	}

	/**
	 * mapbox type
   	 * @returns {MapType} mapbox map type
	 */
	public get nativeMapType(): MapType {
		return MapType.MAPBOX;
	}

	public useCluster: boolean;
	protected config: MapBoxConfig = new MapBoxConfig();

	constructor(config?: IMapBoxConfig) {
		super();

		this.utils = new MapBoxUtilties(this);
		this.geometryUtils = new MapBoxGeometryUtils(this);
		// this.controlBuilder = new LLControlBuilder(this);
		// this.rastersLoader = new LLRastersLoader(this);
		if (typeof config !== "undefined") {
			this.config.update(config);
			this.useCluster = this.config.useCluster;
		}
	}

	public createRasterFromImage(imageUrl: string, bbox: IViewBounds): IBaseLayer {
		const coordinates = [
			[bbox.west, bbox.north],
			[bbox.east, bbox.north],
			[bbox.east, bbox.south],
			[bbox.west, bbox.south]
		];
		let sourceId: string;
		let layerId: string;

		const raster: IBaseLayer = {
			name: "image",
			isSelected: false,
			addToMap: async () => {
				sourceId = MapUtils.generateGuid();
				layerId = MapUtils.generateGuid();
				this.map.addSource(sourceId, {
					type: "image",
					url: imageUrl,
					coordinates
				});
				this.map.addLayer({
					id: layerId,
					source: sourceId,
					type: "raster"
				});
			},
			remove: async () => {
				this.map.removeLayer(layerId);
				this.map.removeSource(sourceId);
			}
		};
		return raster;
	}

	public create3DTilesLayer(url: string): IBaseLayer {
		let layerId: string;
		const threeDLayer: IBaseLayer = {
			name: "3D-Layer",
			isSelected: false,
			addToMap: async () => {
				layerId = MapUtils.generateGuid();
				this.map.addLayer(new Mapbox3DTiles.Layer({
					id: layerId,
					url,
					color: 0xff0000,
					opacity: 1
				}));
			},
			remove: async () => {
				this.map.removeLayer(layerId);
			}
		};

		return threeDLayer;
	}

	public async load(): Promise<void> {
		const mapOptions: mapboxgl.MapboxOptions = {
			container: this.config.mapDivId,
			minZoom: 2,
			maxZoom: 20,
			center: [this.config.center.longitude, this.config.center.latitude],
			zoom: this.config.zoom,
			style: MapBoxStyle.getWmsStyle(this.config.baseWmsUrl,
				[this.config.wmsLayers], "main-layer")
			// style: "mapbox://styles/mapbox/light-v10?optimize=true"
		};
		// (mapboxgl as any).accessToken = "pk.eyJ1IjoiZWxhZC1zaGVjaHRlciIsImEiOiJjazd2a3dla24xOWdiM2VuMTRicnM0dGt6In0.ryRmPDkEFHEfMcuPHJQGlQ";
		mapboxgl.setRTLTextPlugin(mapboxgl_rtl_text, null, false);
		this.map = new mapboxgl.Map(mapOptions);

		this.geometryBuilder = new MapBoxGeometryBuilder(this);
		this.geometryDrawing = new MapBoxGeometryDrawing(this);
		this.geometryDragging = new MapBoxGeometryDragEdit(this);
		const navigationControl = new mapboxgl.NavigationControl({
			showCompass: true,
			showZoom: true,
			visualizePitch: true
		});
		this.map.addControl(navigationControl, "top-left");

		return new Promise<void>(resolve => {
			this.map.once("load", () => {
				resolve();
			});
		});
	}

	public getViewBounds(): IViewBounds {
		let mapboxBounds = this.map.getBounds();
		let bounds = new ViewBounds(mapboxBounds.getNorth(),
			mapboxBounds.getSouth(),
			mapboxBounds.getWest(),
			mapboxBounds.getEast());
		return bounds;
	}

	public getViewCenter(): Coordinate {
		return MapBoxUtilties.lngLatToCoordinate(this.map.getCenter());
	}

	public async flyTo(coordinate: Coordinate, flyDuration: number = this.FLY_DURATION): Promise<void> {
		const lngLat = MapBoxUtilties.coordinateToLngLat(coordinate);
		const options: mapboxgl.FlyToOptions = {
			center: lngLat,
			duration: flyDuration
		};
		const eventData: mapboxgl.EventData = {};
		this.map.flyTo(options, eventData);

		return this.flyEndPromise(eventData);
	}

	public async flyToBounds(southWest: Coordinate, northEast: Coordinate, flyDuration: number = this.FLY_DURATION): Promise<void> {
		const sw = MapBoxUtilties.coordinateToLngLat(southWest);
		const ne = MapBoxUtilties.coordinateToLngLat(northEast);
		const bound = [southWest.longitude, southWest.latitude, northEast.longitude, northEast.latitude] as mapboxgl.LngLatBoundsLike;
		const bounds = new mapboxgl.LngLatBounds(sw, ne);
		const options: mapboxgl.FlyToOptions = {
			duration: flyDuration
		};
		const eventData: mapboxgl.EventData = {};
		this.map.fitBounds(bound, options, eventData);

		return this.flyEndPromise(eventData);
	}

	public async setZoom(zoom: number): Promise<void> {
		const eventData: mapboxgl.EventData = {};
		this.map.setZoom(zoom, eventData);
		return this.flyEndPromise(eventData);
	}

	public getHeading(): number {
		return this.map.getBearing();
	}

	public setHeading(azimuth: number): void {
		this.map.setBearing(azimuth);
	}

	getRasters(): RasterInfo[] {
		throw Error("Method not implemented.");
	}

	// TODO: Not implemented | TODO: more valuable name ?
	public loadKML(kmlDocument: Document | string, changePolyToLine?: boolean, hover?: boolean): Promise<IKMLGeometryCollection> {
		throw Error("Method not implemented.");
	}

	protected addClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.utils.onMouseEvent("click", listener);
	}

	protected addDblClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.utils.onMouseEvent("dblclick", listener);
	}

	protected addRightClickListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.utils.onMouseEvent("contextmenu", listener);
	}

	protected addMouseMoveListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.utils.onMouseEvent("mousemove", listener);
	}

	protected addMouseDownListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.utils.onMouseEvent("mousedown", listener);
	}

	protected addMouseUpListener(listener: (eventArgs?: MapEventArgs) => void): () => void {
		return this.utils.onMouseEvent("mouseup", listener);
	}

	protected addZoomChangedListener(listener: ((currentZoom: number) => void)): () => void {
		let onZoomChanged = (eventParams) => {
			listener(this.map.getZoom());
		};

		this.map.on("zoomend", onZoomChanged);

		return () => {
			this.map.off("zoomend", onZoomChanged);
		};
	}

	protected addViewChangedListener(listener: ((bounds: IViewBounds) => void)): () => void {
		let onViewChanged = (eventParams) => {
			listener(this.getViewBounds());
		};

		this.map.on("moveend", onViewChanged);

		return () => {
			this.map.off("moveend", onViewChanged);
		};
	}

	public getConfig(): IMapBoxConfig {
		return <IMapBoxConfig>super.getConfig();
	}

	// TODO: Not implemented | TODO: more valuable name ?
	public changeDimension() {
		throw Error("Method not implemented.");
	}

	// TODO: Not implemented | TODO: more valuable name ?
	public getIs2D(): boolean {
		return true;
	}

	public orientMapNorth(tilt: boolean = false, flyDuration: number = this.FLY_DURATION): void {
		const options: mapboxgl.FlyToOptions = {
			duration: flyDuration
		};
		if (tilt) {
			(this.map as any).resetNorthPitch(options);
		} else {
			this.map.resetNorth(options);
		}
	}

	private flyEndPromise(eventData: mapboxgl.EventData): Promise<void> {
		return new Promise(resolve => {
			this.map.once("zoomend", (event) => {
				if (eventData === event) {
					resolve();
				}
			});
		});
	}
}