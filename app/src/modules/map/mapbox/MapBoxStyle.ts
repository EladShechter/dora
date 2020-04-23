import { MapBoxWmsProvider } from "./MapBoxWmsProvider";
export class MapBoxStyle {
    public static getWmsStyle(
        baseWmsUrl: string,
        wmsLayers: string[],
        layerAndSourceId: string): mapboxgl.Style {

        return {
            version: 8,
            sources: {
                [layerAndSourceId]: MapBoxWmsProvider.getWmsSource(baseWmsUrl, wmsLayers)
            },
            layers: [
                MapBoxWmsProvider.getWmsLayer(layerAndSourceId, layerAndSourceId)
            ],
            glyphs: "/fonts/{fontstack}/{range}.pbf"
        };
    }
}