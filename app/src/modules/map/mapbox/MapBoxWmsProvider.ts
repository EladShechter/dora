import * as mapboxgl from "mapbox-gl";
export class MapBoxWmsProvider {
    public static getWmsStyle(
        baseWmsUrl: string,
        wmsLayers: string[],
        layerAndSourceId: string): mapboxgl.Style {

        return {
			version: 8,
			sources: {
				[layerAndSourceId]: this.getWmsSource(baseWmsUrl, wmsLayers)
			},
			layers: [
				this.getWmsLayer(layerAndSourceId, layerAndSourceId)
            ],
            glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf"
		};
    }

    public static addWmsLayer(
        map: mapboxgl.Map,
        baseWmsUrl: string,
        wmsLayers: string[],
        layerAndSourceId: string) {

		map.addSource(layerAndSourceId, this.getWmsSource(baseWmsUrl, wmsLayers));
		map.addLayer(this.getWmsLayer(layerAndSourceId, layerAndSourceId));
    }

	private static getWmsSource(baseWmsUrl: string, wmsLayers: string[]): mapboxgl.RasterSource {
		const wmsParams = [
			["bbox", "{bbox-epsg-3857}"],
			["format", "image/png"],
			["service", "WMS"],
			["version", "1.3.0"],
			["request", "GetMap"],
			["crs", "EPSG:3857"],
			["transparent", "true"],
			["width", "256"],
			["height", "256"],
			["layers", wmsLayers.join(",")],
		];
		const wmsParamsString = wmsParams.map(param => param.join("=")).join("&");
		return {
			type: "raster",
			tiles: [ `${baseWmsUrl}?${wmsParamsString}`	],
			tileSize: 256
		};
	}

	private static getWmsLayer(mapBoxLayerId: string, sourceName: string): mapboxgl.Layer {
		return {
			id: mapBoxLayerId,
			type: "raster",
			source: sourceName,
			paint: {}
		};
	}
}