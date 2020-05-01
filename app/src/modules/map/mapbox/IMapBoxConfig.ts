import { IMapConfig } from "../config/IMapConfig";

export interface IMapBoxConfig extends IMapConfig {
	useCluster?: boolean;
	baseWmsUrl?: string;
	wmsLayers?: string;
	zoom?: number;
	is2D?: boolean;
}