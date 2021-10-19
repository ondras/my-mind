import Shape from "./shape.js";


export default class Ellipse extends Shape {
	constructor() {
		super("ellipse", "Ellipse");
	}
}

new Ellipse();