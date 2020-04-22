import { MapBoxComponent } from "../../MapBoxComponent";
import * as MapboxDraw from "@mapbox/mapbox-gl-draw";

export class MapBoxDrawService {
    private static drawLibrary;
    public static getDrawLibraryInstance() {
        if (!this.drawLibrary) {
            throw new Error("draw library not initialized");
        }
        return this.drawLibrary;
    }

    public static initialize(mapComponent: MapBoxComponent) {
        if (!this.drawLibrary) {
            this.drawLibrary = new MapboxDraw({
                keybindings: false,
                touchEnabled: false,
                boxSelect: false,
                displayControlsDefault: false
            });
            mapComponent.nativeMapInstance.addControl(this.drawLibrary);
        }
    }
}