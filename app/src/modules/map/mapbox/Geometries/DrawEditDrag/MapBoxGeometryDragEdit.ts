import { MapBoxComponent } from "../../MapBoxComponent";
import { IGeometry } from "../../../Geometries/IGeometry";
import { MapBoxDrawService } from "./MapBoxDrawService";

export class MapBoxGeometryDragEdit {
	private draw;
	private readonly DRAG_FINISH_BY_MOUSE_EVENT = "draw.selectionchange";
	private changeToDragMode: () => void;
	private readonly EDIT_FINISH_BY_MOUSE_EVENT = "draw.modechange";
	private changeToEditMode: () => void;

	constructor(private mapComponent: MapBoxComponent) {
		MapBoxDrawService.initialize(this.mapComponent);
		this.draw = MapBoxDrawService.getDrawLibraryInstance();
	}

	public startDragGeometry(geometry: IGeometry): void {
		const featureIds = this.addEditableGeometry(geometry);
		this.changeToDragMode = () => {
			this.draw.changeMode(this.draw.modes.SIMPLE_SELECT, { featureIds });
		};
		this.changeToDragMode();
		this.mapComponent.nativeMapInstance.on(
			this.DRAG_FINISH_BY_MOUSE_EVENT, this.changeToDragMode);
	}

	public startEditGeometry(geometry: IGeometry): void {
		const featureIds = this.addEditableGeometry(geometry);
		this.changeToEditMode = () => {
			this.draw.changeMode(this.draw.modes.DIRECT_SELECT, { featureId: featureIds[0] });
		};
		this.changeToEditMode();
		this.mapComponent.nativeMapInstance.on(
			this.EDIT_FINISH_BY_MOUSE_EVENT, this.changeToEditMode);
	}

	public getNewGeoJsonFeature() {
		return this.draw.getAll().features[0];
	}

	public exitEditMode() {
		this.mapComponent.nativeMapInstance.off(
			this.EDIT_FINISH_BY_MOUSE_EVENT, this.changeToEditMode);
		this.draw.deleteAll();
	}

	public exitDragMode() {
		this.mapComponent.nativeMapInstance.off(
			this.DRAG_FINISH_BY_MOUSE_EVENT, this.changeToDragMode);
		this.draw.deleteAll();
	}

	private addEditableGeometry(geometry: IGeometry): string[] {
		const geoJson = geometry.getGeoJSON();
		return this.draw.add(geoJson);
	}

}