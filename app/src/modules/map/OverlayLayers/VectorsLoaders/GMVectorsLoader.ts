import { IBaseLayersLoader } from "../IBaseLayersLoader";
import { VectorLayer } from "../VectorLayer";

export class GMVectorsLoader implements IBaseLayersLoader<VectorLayer> {
	public loadLayers(): Promise<VectorLayer[]> {
		throw new Error("Method not implemented.");
	}
}