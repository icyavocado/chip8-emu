class Display {
  constructor(canvas, pixelSize = 10) {
    // Screen resolution of 64x32
    this.WIDTH_RES = 64;
    this.HEIGHT_RES = 32;

    this.canvasWidth = this.WIDTH_RES * pixelSize;
    this.canvasHeight = this.HEIGHT_RES * pixelSize;

    if (!canvas) {
      console.error("Canvas is not defined", this);
      throw Error("No canvas for display rendering");
    }
    this.canvas = canvas;
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;

    this.ctx = this.canvas.getContext("2d");

    this.pixelSize = pixelSize || 10;

    this.pixelArray = [];
    this.reset();
  }
  reset() {
    this.pixelArray = new Uint8Array(this.WIDTH_RES * this.HEIGHT_RES);
    this.resetCanvas();
  }
  resetCanvas() {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(
      0,
      0,
      this.WIDTH_RES * this.pixelSize,
      this.HEIGHT_RES * this.pixelSize
    );
  }
  pixelRender(Vx, Vy) {
    let pixel = Vx + Vy * this.WIDTH_RES;
    let collision = !!this.pixelArray[pixel];
    this.pixelArray[pixel] ^= 1;
    return collision;
  }
  render() {
    this.resetCanvas();
    for (let i = 0; i < this.pixelArray.length; i++) {
      this.ctx.beginPath();
      this.ctx.fillStyle = "#FFF";
      let x = i % this.WIDTH_RES;
      let y = Math.floor(i / this.WIDTH_RES);
      let rectDefinition = [
        x * this.pixelSize,
        y * this.pixelSize,
        this.pixelSize,
        this.pixelSize
      ];
      if (this.pixelArray[i]) {
        this.ctx.fillRect(...rectDefinition);
      }

      this.ctx.strokeStyle = "#050505";
      this.ctx.rect(...rectDefinition);
      this.ctx.stroke();
    }
  }
}

module.exports = Display;
