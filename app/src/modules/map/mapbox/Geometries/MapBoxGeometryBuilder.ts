
import { IArrowGeometryDesign } from "../../GeometryDesign/Interfaces/IArrrowGeometryDesign";
import { IDoubleLineGeometryDesign } from "../../GeometryDesign/Interfaces/IDoubleLineGeometryDesign";
import { IGeometryDesign } from "../../GeometryDesign/Interfaces/IGeometryDesign";
import { Arrow } from "../../Geometries/Arrow";
import { Coordinate } from "../../Geometries/Coordinate";
import { DoubleLine } from "../../Geometries/DoubleLine";
import { Line } from "../../Geometries/Line";
import { Point } from "../../Geometries/Point";
import { Polygon } from "../../Geometries/Polygon";
import { GeometryBuilder } from "../../Geometries/Builder/GeometryBuilder";
import { ILayer } from "../../Layers/ILayer";
import { Geometry } from "../../Geometries/Geometry";
import { MapBoxLayer } from "./MapBoxLayer";
import { MapBoxComponent } from "../MapBoxComponent";
import { MapBoxPoint } from "./MapBoxPoint";
import { MapBoxLine } from "./MapBoxLine";
import { MapBoxArrow } from "./MapBoxArrow";
import { MapBoxPolygon } from "./MapBoxPolygon";

export class MapBoxGeometryBuilder extends GeometryBuilder {
	constructor(private mapComponent: MapBoxComponent) {
		super();
	}

	public buildLayer(): ILayer {
		return new MapBoxLayer(this.mapComponent);
	}

	public buildPoint(coordinate: Coordinate, design?: IGeometryDesign): Point {
		return new MapBoxPoint(this.mapComponent, coordinate, design);
	}

	public buildLine(coordinates: Coordinate[], design?: IGeometryDesign): Line {
		return new MapBoxLine(this.mapComponent, coordinates, design);
	}

	public buildArrow(coordinates: Coordinate[], design?: IArrowGeometryDesign): Arrow {
		return new MapBoxArrow(this.mapComponent, coordinates, design);
	}

	public buildPolygon(coordinates: Coordinate[] | Coordinate[][], design?: IGeometryDesign): Polygon {
		return new MapBoxPolygon(this.mapComponent, coordinates, design);
	}

	public buildDoubleLine(coordinates: Coordinate[], design?: IDoubleLineGeometryDesign): DoubleLine {
		return new DoubleLine(this.mapComponent, coordinates, design);
	}

	public buildFromNativeEntity(entity: any): Geometry {
		throw "not implemented";
	}
}
