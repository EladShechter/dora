import { MapConfig } from "../Config/MapConfig";
import { IMapBoxConfig } from "./IMapBoxConfig";

export class MapBoxConfig extends MapConfig implements IMapBoxConfig {

	public useCluster: boolean;
	public zoom: number = 7;
	public baseWmsUrl: string = "https://www.gebco.net/data_and_products/gebco_web_services/2019/mapserv";
	public wmsLayers: string = "GEBCO_2019";
	public is2D: boolean = true;

}