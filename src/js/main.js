import Chip8 from "./chip8/chip8";
import roms from "RES/roms/roms.json";
import "@/css/main.scss";

import Swiper from "swiper";

function main() {
  roms.forEach(rom => {
    const base64File = require(`RES/roms/${rom.file}`);
    rom.base64 = base64File.default.split(",")[1];
  });

  const swiperContainer = document.querySelector(
    ".game-select > .swiper-container"
  );

  roms.forEach(rom => {
    swiperContainer
      .querySelector(".swiper-wrapper")
      .append(renderSlide(romRender(rom, 14)));
  });

  const swiper = new Swiper(swiperContainer, {
    speed: 400,
    spaceBetween: 50,
    slidesOffsetBefore: 100,
    slidesPerView: 1.8,
    effect: "coverflow",
    coverflowEffect: {
      rotate: 20,
      slideShadows: false
    },
    scrollbar: {
      el: ".swiper-scrollbar",
      draggable: true
    }
  });
}

function romRender(rom, pixelSize) {
  let canvas = document.createElement("canvas");
  let chip8 = readFile(rom.base64, canvas, pixelSize);
  setTimeout(() => chip8.pause(), 18000);
  canvas.addEventListener("mouseover", function() {
    chip8.resume();
  });
  canvas.addEventListener("mouseleave", function() {
    chip8.pause();
  });
  return {
    canvas,
    chip8,
    info: {
      title: rom.title,
      description: rom.description
    }
  };
}

function readFile(file, canvas, pixelSize) {
  const byteCharacters = atob(file);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const program = new Uint8Array(byteNumbers);
  const chip8 = new Chip8(canvas, {
    display: {
      pixelSize: pixelSize || 12
    }
  });
  chip8.loadProgram(program); // Good
  chip8.run();
  return chip8;
}

function renderSlide(romObject) {
  let slide = document.createElement("div");
  slide.classList.add("swiper-slide");

  /* prettier-ignore */
  const markup = `
  <div class="card" style="width: ${14 * 64}px">
    <div class="card-img-top" alt="Card image cap"></div>
    <div class="card-body">
      <h5 class="card-title">${romObject.info.title}</h5>
      <p class="card-text overflow-auto" style="max-height: 180px;">${romObject.info.description}.</p>
    </div>
  </div>
  `;

  slide.insertAdjacentHTML("beforeend", markup);
  romObject.chip8.muted();
  slide.querySelector(".card-img-top").append(romObject.canvas);
  return slide;
}
main();
