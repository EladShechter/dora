import { FillPatternName } from "../../../GeometryDesign/Enums";

export class MapBoxFillPatternCreator {
    private static readonly patternDrawMethodsDict = {
        [FillPatternName.Striped]: MapBoxFillPatternCreator.drawStriped,
        [FillPatternName.HorizontalStriped]: MapBoxFillPatternCreator.drawHorizontalStriped,
        [FillPatternName.VerticalStriped]: MapBoxFillPatternCreator.drawVerticalStriped,
        [FillPatternName.DiagonalSquares]: MapBoxFillPatternCreator.drawDiagonalSquares,
        [FillPatternName.Squares]: MapBoxFillPatternCreator.drawSquares
    };

    private static readonly PATTERN_SIZE = 16;

    public static createFillPatternImage(
        map: mapboxgl.Map,
        fillPattern: FillPatternName,
        fillColor: string): string {

        const imagePatternName = `fill-pattern-${ fillPattern }-${ fillColor }`;
        if (!map.hasImage(imagePatternName)) {
            const canvas = document.createElement("canvas");
            canvas.height = this.PATTERN_SIZE;
            canvas.width = this.PATTERN_SIZE;
            var ctx = canvas.getContext("2d");
            ctx.strokeStyle = fillColor;
            this.patternDrawMethodsDict[fillPattern](ctx);
            ctx.stroke();
            const imageData = ctx.getImageData(0, 0, this.PATTERN_SIZE, this.PATTERN_SIZE);
            map.addImage(imagePatternName, imageData);
        }
        return imagePatternName;
    }

    private static drawStriped(ctx: CanvasRenderingContext2D) {
        const size = MapBoxFillPatternCreator.PATTERN_SIZE;
        ctx.moveTo(size, 0);
        ctx.lineTo(0, size);
    }

    private static drawHorizontalStriped(ctx: CanvasRenderingContext2D) {
        const size = MapBoxFillPatternCreator.PATTERN_SIZE;
        const center = size / 2;
        ctx.moveTo(0, center);
        ctx.lineTo(size, center);
    }

    private static drawVerticalStriped(ctx: CanvasRenderingContext2D) {
        const size = MapBoxFillPatternCreator.PATTERN_SIZE;
        const center = size / 2;
        ctx.moveTo(center, 0);
        ctx.lineTo(center, size);
    }

    private static drawDiagonalSquares(ctx: CanvasRenderingContext2D) {
        const size = MapBoxFillPatternCreator.PATTERN_SIZE;
        MapBoxFillPatternCreator.drawStriped(ctx);
        ctx.moveTo(0, 0);
        ctx.lineTo(size, size);
    }

    private static drawSquares(ctx: CanvasRenderingContext2D) {
        MapBoxFillPatternCreator.drawHorizontalStriped(ctx);
        MapBoxFillPatternCreator.drawVerticalStriped(ctx);
    }
}