import { LinePatternName } from "../../../GeometryDesign/Enums";

export class MapBoxLinePatternCreator {
    private static readonly patternDrawMethodsDict = {
        [LinePatternName.Arc1]: MapBoxLinePatternCreator.drawArc1,
        [LinePatternName.Arc2]: MapBoxLinePatternCreator.drawArc2,
        [LinePatternName.Dashed]: MapBoxLinePatternCreator.drawDashed,
        [LinePatternName.DashedDotted]: MapBoxLinePatternCreator.drawDashedDotted,
        [LinePatternName.Dotted]: MapBoxLinePatternCreator.drawDashedDotted,
        [LinePatternName.Ditch]: MapBoxLinePatternCreator.drawDitch,
        [LinePatternName.Double]: MapBoxLinePatternCreator.drawDouble,
        [LinePatternName.DoubleDashed]: MapBoxLinePatternCreator.drawDoubleDashed,
        [LinePatternName.DoubleEmptyTriangle]: MapBoxLinePatternCreator.drawDoubleEmptyTriangle,
        [LinePatternName.EmptyRectangle]: MapBoxLinePatternCreator.drawEmptyRectangle,
        [LinePatternName.EmptyTriangle]: MapBoxLinePatternCreator.drawEmptyTriangle,
        [LinePatternName.SharpTriangle]: MapBoxLinePatternCreator.drawSharpTriangle,
        [LinePatternName.SmallRectangle]: MapBoxLinePatternCreator.drawSmallRectangle,
        [LinePatternName.SmallTriangle1]: MapBoxLinePatternCreator.drawSmallTriangle1,
        [LinePatternName.SmallTriangle2]: MapBoxLinePatternCreator.drawSmallTriangle2,
        [LinePatternName.Triangle1]: MapBoxLinePatternCreator.drawTriangle1,
        [LinePatternName.Triangle2]: MapBoxLinePatternCreator.drawTriangle2,
        [LinePatternName.X]: MapBoxLinePatternCreator.drawX,
        [LinePatternName.TwoSidesRectangle]: MapBoxLinePatternCreator.drawTwoSidesRectangle,
    };

    public static createLinePatternImage(
        map: mapboxgl.Map,
        linePattern: LinePatternName,
        lineColor: string,
        size: number): string {

        const imagePatternName = `line-pattern-${ linePattern }-${ lineColor }`;
        if (!map.hasImage(imagePatternName)) {
            const canvas = document.createElement("canvas");
            canvas.height = size;
            canvas.width = size;
            var ctx = canvas.getContext("2d");
            ctx.strokeStyle = lineColor;
            ctx.fillStyle = lineColor;
            this.patternDrawMethodsDict[linePattern](ctx, size);
            const imageData = ctx.getImageData(0, 0, size, size);
            map.addImage(imagePatternName, imageData);
        }
        return imagePatternName;
    }

    private static drawArc1(ctx: CanvasRenderingContext2D, size: number) {
        ctx.arc(size / 2, size * 0.25, size / 2, 0, Math.PI, false);
        ctx.stroke();
    }

    private static drawArc2(ctx: CanvasRenderingContext2D, size: number) {
        ctx.arc(size / 2, size * 0.75, size / 2, 0, Math.PI, true);
        ctx.stroke();
    }

    private static drawDashed(ctx: CanvasRenderingContext2D, size: number) {
        ctx.moveTo(size * 0.25, size * 0.5);
        ctx.lineTo(size * 0.75, size * 0.5);
        ctx.stroke();
    }

    private static drawDashedDotted(ctx: CanvasRenderingContext2D, size: number) {
        ctx.fillRect(size * 0.4, size * 0.4, size * 0.2, size * 0.2);
    }

    private static drawDitch(ctx: CanvasRenderingContext2D, size: number) {
        ctx.moveTo(0, size * 0.4);
        ctx.lineTo(size, size * 0.4);
        ctx.moveTo(size * 0.5, size * 0.4);
        ctx.lineTo(size * 0.5, size * 0.9);
        ctx.stroke();
    }

    private static drawDouble(ctx: CanvasRenderingContext2D, size: number) {
        ctx.moveTo(0, size * 0.3);
        ctx.lineTo(size, size * 0.3);
        ctx.moveTo(0, size * 0.6);
        ctx.lineTo(size, size * 0.6);
        ctx.stroke();
    }

    private static drawDoubleDashed(ctx: CanvasRenderingContext2D, size: number) {
        ctx.moveTo(size * 0.25, size * 0.3);
        ctx.lineTo(size * 0.75, size * 0.3);
        ctx.moveTo(size * 0.25, size * 0.6);
        ctx.lineTo(size * 0.75, size * 0.6);
        ctx.stroke();
    }

    private static drawDoubleEmptyTriangle(ctx: CanvasRenderingContext2D, size: number) {
        ctx.moveTo(0, size * 0.2);
        ctx.lineTo(size, size * 0.2);
        ctx.moveTo(0, size * 0.8);
        ctx.lineTo(size, size * 0.8);
        ctx.moveTo(0, size * 0.2);
        ctx.lineTo(size / 2, size * 0.8);
        ctx.lineTo(size, size * 0.2);
        ctx.stroke();
    }

    private static drawEmptyRectangle(ctx: CanvasRenderingContext2D, size: number) {
        ctx.strokeRect(0, size * 0.1, size, size * 0.8);
    }

    private static drawEmptyTriangle(ctx: CanvasRenderingContext2D, size: number) {
        ctx.moveTo(0, size * 0.2);
        ctx.lineTo(size, size * 0.2);
        ctx.lineTo(size / 2, size * 0.8);
        ctx.lineTo(0, size * 0.2);
        ctx.stroke();
    }

    private static drawSharpTriangle(ctx: CanvasRenderingContext2D, size: number) {
        ctx.moveTo(size * 0.1, size * 0.1);
        ctx.lineTo(size * 0.4, size * 0.1);
        ctx.lineTo(size * 0.25, size * 0.9);
        ctx.lineTo(size * 0.1, size * 0.1);

        ctx.moveTo(size * 0.6, size * 0.1);
        ctx.lineTo(size * 0.9, size * 0.1);
        ctx.lineTo(size * 0.75, size * 0.9);
        ctx.lineTo(size * 0.6, size * 0.1);
        ctx.fill();
    }

    private static drawSmallRectangle(ctx: CanvasRenderingContext2D, size: number) {
        ctx.fillRect(size * 0.3, size * 0.3, size * 0.4, size * 0.4);
        ctx.moveTo(0, size * 0.7);
        ctx.lineTo(size, size * 0.7);
        ctx.stroke();
    }

    private static drawSmallTriangle1(ctx: CanvasRenderingContext2D, size: number) {
        ctx.moveTo(0, size * 0.3);
        ctx.lineTo(size, size * 0.3);
        ctx.stroke();
        ctx.moveTo(size * 0.8, size * 0.3);
        ctx.lineTo(size / 2, size * 0.7);
        ctx.lineTo(size * 0.2, size * 0.3);
        ctx.fill();
    }

    private static drawSmallTriangle2(ctx: CanvasRenderingContext2D, size: number) {
        ctx.moveTo(0, size * 0.7);
        ctx.lineTo(size, size * 0.7);
        ctx.stroke();
        ctx.moveTo(size * 0.8, size * 0.7);
        ctx.lineTo(size / 2, size * 0.3);
        ctx.lineTo(size * 0.2, size * 0.7);
        ctx.fill();
    }

    private static drawTriangle1(ctx: CanvasRenderingContext2D, size: number) {
        ctx.moveTo(0, size * 0.2);
        ctx.lineTo(size / 2, size * 0.8);
        ctx.lineTo(size, size * 0.2);
        ctx.fill();
    }

    private static drawTriangle2(ctx: CanvasRenderingContext2D, size: number) {
        ctx.moveTo(0, size * 0.8);
        ctx.lineTo(size / 2, size * 0.2);
        ctx.lineTo(size, size * 0.8);
        ctx.fill();
    }

    private static drawX(ctx: CanvasRenderingContext2D, size: number) {
        ctx.moveTo(size * 0.2, size * 0.2);
        ctx.lineTo(size * 0.8, size * 0.8);

        ctx.moveTo(size * 0.8, size * 0.2);
        ctx.lineTo(size * 0.2, size * 0.8);

        ctx.stroke();
    }

    private static drawTwoSidesRectangle(ctx: CanvasRenderingContext2D, size: number) {
        ctx.moveTo(0, size * 0.5);
        ctx.lineTo(size, size * 0.5);
        ctx.stroke();

        ctx.fillRect(size * 0.1, size * 0.2, size * 0.3, size * 0.3);
        ctx.fillRect(size * 0.6, size * 0.5, size * 0.3, size * 0.3);
    }
}