import { MapBoxComponent } from "../MapBoxComponent";
import { MapUtils } from "../../MapUtils/MapUtils";
import { Coordinate } from "../../Geometries/Coordinate";
import * as mapboxgl from "mapbox-gl";
import { MapBoxUtilties } from "../MapBoxUtilities";
import { MapEventArgs } from "../../Events/MapEventArgs";


export class MapBoxGeometryUtils {
    constructor(private mapComponent: MapBoxComponent) {
    }

    public generateGeoJsonShape(
        jsonGeometry: GeoJSON.Feature | GeoJSON.FeatureCollection,
        layerType: "fill" | "line" | "symbol",
        layer?: mapboxgl.Layer): mapboxgl.Layer {
        const map = this.mapComponent.nativeMapInstance;
        let id = layer && layer.id;
        let source: mapboxgl.GeoJSONSource;
        if (id) {
            source = map.getSource(id) as mapboxgl.GeoJSONSource;
        }

        if (!source) {
            id = id || MapUtils.generateGuid();
            const sourceOptions: mapboxgl.GeoJSONSourceRaw = {
                type: "geojson",
                data: jsonGeometry
            };
            map.addSource(id, sourceOptions);
            layer = {
                ...layer,
                id: id,
                source: id,
                type: layerType
            };
        }
        else {
            source.setData(jsonGeometry);
            if (map.getLayer(id)) {
                if (layer.paint) {
                    Object.entries(layer.paint).forEach(item => {
                        map.setPaintProperty(id, item[0], item[1]);
                    });
                }
                if (layer.layout) {
                    Object.entries(layer.layout).forEach(item => {
                        map.setLayoutProperty(id, item[0], item[1]);
                    });
                }
            }
        }

        return layer;
    }

    public applyAfterLayerAdded(layer: mapboxgl.Layer): Promise<void> {
        return new Promise(reslove => {
            const resloveIfLayerOnMap = () => {
                const layerOnMap = this.mapComponent.nativeMapInstance.getLayer(layer.id);
                layerOnMap && reslove();
                return !!layerOnMap;
            };
            if (!resloveIfLayerOnMap()) {
                this.mapComponent.nativeMapInstance.once("styledata", resloveIfLayerOnMap);
            }
        });
    }

    public async applyAfterLayersAdded(layers: mapboxgl.Layer[]): Promise<void> {
        const promises: Promise<void>[] = layers.map(layer => this.applyAfterLayerAdded(layer));
        await Promise.all(promises);
    }

    public openBalloonHtml(coordinate: Coordinate, html: string): void {
        new mapboxgl.Popup()
            .setLngLat(MapBoxUtilties.coordinateToLngLat(coordinate))
            .setHTML(html)
            .addTo(this.mapComponent.nativeMapInstance);
    }

    public setGeometryVisibility(layer: mapboxgl.Layer, state: boolean): void {
        this.mapComponent.nativeMapInstance.setLayoutProperty(
            layer.id, "visibility", state ? "visible" : "none");
    }

    public addEntityMouseEventForMultipleLayers(listener: (eventArgs?: MapEventArgs) => void, eventName: keyof mapboxgl.MapLayerEventType, layers: mapboxgl.Layer[]): () => void {
        const removeEventFns = [];
        layers.forEach(layer => {
            removeEventFns.push(this.mapComponent.utils.addEntityMouseEvent(listener, eventName, layer));
        });

        return () => {
            removeEventFns.forEach(fn => fn());
        };
    }
}