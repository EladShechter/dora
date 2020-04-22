import { MapBoxComponent, IMapBoxConfig } from "../../app/src/dora-mapbox";
import { Application } from "./Application";

let config: IMapBoxConfig = {
	mapDivId: "map",
	useCluster: true
};

export class MapBoxApplication extends Application {
	constructor() {
		super(new MapBoxComponent(config));
	}
}