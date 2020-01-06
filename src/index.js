const Chip8 = require("./chip8");
const roms = require("./res/roms/roms.json");
const style = require("./css/main.css");

function main() {
  roms.forEach(rom => {
    const base64File = require(`./res/roms/${rom.file}`);
    rom.base64 = base64File.default.split(",")[1];
  });

  const romsContainer = document.querySelector("#roms");

  roms.forEach(rom => {
    romsContainer.append(romRender(rom));
  });
}

function romRender(rom) {
  let canvas = document.createElement("canvas");
  let chip8 = readFile(rom.base64, canvas);
  chip8.pause();
  canvas.addEventListener("mouseover", function() {
    chip8.resume();
  });
  canvas.addEventListener("mouseleave", function() {
    chip8.pause();
  });
  return canvas;
}
function readFile(file, canvas) {
  const byteCharacters = atob(file);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const program = new Uint8Array(byteNumbers);
  const chip8 = new Chip8(canvas, {
    pixelSize: 14
  });
  chip8.loadProgram(program); // Good
  chip8.run();
  return chip8;
}

main();
