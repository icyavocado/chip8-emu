const Display = require("./display");
const Keyboard = require("./keyboard");
const beepWav = require("./res/sounds/beep-01a.wav");

class Chip8 {
  constructor(el, { chip = {}, display = {} }) {
    let { speed, cycle } = chip;
    let { pixelSize } = display;
    this.TICK = speed ? 1000 / speed : 1000 / 60;
    this.CYCLE = cycle || 10;
    this.delay_timer = 0;
    this.sound_timer = 0;
    this.beepSound = new Audio(beepWav.default);
    this.display = new Display(el, pixelSize);
    this.keyboard = new Keyboard(this);
    this.reset();
    this.loadFont();
  }
  run() {
    const that = this;
    setInterval(function() {
      for (var i = 0; i < that.CYCLE; i++) {
        that.cycle();
      }
      that.updateTimer();
    }, this.TICK);
  }
  cycle() {
    if (this.halt) return;

    let opcode = 0;

    if (this.pc + 1 >= 4096) {
      console.error("Pointer Out of Bound", this.pc);
      return;
    }

    opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
    this._advance2();
    for (let i = 0; i < this.opTable.length != 0; i++) {
      let entry = this.opTable[i];
      if ((opcode & entry.mask) == entry.opcode) {
        this.logs.push(
          this.pc.toString(16),
          opcode.toString(16),
          this.de(opcode)
        );
        entry.instruction(this.de(opcode));
        break;
      }
    }
  }

  reset() {
    this.display.reset();

    this.memory = new Array(4096);
    this.v = new Uint8Array(16);
    this.i = null;
    this.pc = 0x200;

    this.delay_timer = 0;
    this.sound_timer = 0;

    this.stack = new Array(16);
    this.sp = 0;

    this.resetTimer();

    this.halt = false;

    // Tracking purpose only | I like reading logs
    this.logs = new Array();

    this.opTable = this.initOpCodeTable();
  }

  pause() {
    this.halt = true;
  }
  resume() {
    this.halt = false;
  }
  resetTimer() {
    this.delay_timer = 0;
    this.sound_timer = 0;
  }
  updateTimer() {
    if (this.delay_timer > 0) {
      this.delay_timer--;
    }
    if (this.sound_timer > 0) {
      if (this.beepSound) {
        this.beepSound.pause();
        this.beepSound.currentTime = 0;
        this.beepSound.play();
      }
      this.sound_timer--;
    } else {
      this.beepSound.currentTime = 0;
      this.beepSound.pause();
    }
  }

  loadFont() {
    /* prettier-ignore */
    const fonts = [
      0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
      0x20, 0x60, 0x20, 0x20, 0x70, // 1
      0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
      0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
      0x90, 0x90, 0xF0, 0x10, 0x10, // 4
      0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
      0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
      0xF0, 0x10, 0x20, 0x40, 0x40, // 7
      0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
      0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
      0xF0, 0x90, 0xF0, 0x90, 0x90, // A
      0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
      0xF0, 0x80, 0x80, 0x80, 0xF0, // C
      0xE0, 0x90, 0x90, 0x90, 0xE0, // D
      0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
      0xF0, 0x80, 0xF0, 0x80, 0x80  // F
    ];

    fonts.forEach((instructions, index) => {
      this.memory[index] = instructions;
    });
  }

  writeToLog(message, payload) {
    this.logs.push({
      message,
      payload
    });
  }

  loadProgram(program) {
    if (!program) {
      console.error("Program is not available", program);
      return;
    }
    if (!this.memory || this.memory.length != 4096) {
      console.error("Memory Error", this.memory);
      throw Error("Memory Error");
    }
    program.forEach((v, i) => {
      this.memory[0x200 + i] = v;
    });

    this.writeToLog("Program loaded", program);
  }

  initOpCodeTable() {
    const that = this;
    return this.opcodeTable().map(
      el => new this.OpcodeTableEntry(el[0], el[1], el[2].bind(that))
    );
  }

  OpcodeTableEntry(opcode, mask, instruction) {
    this.opcode = opcode;
    this.mask = mask;
    this.instruction = instruction;
  }

  opCode00E0(/* opcode */) {
    this.display.reset();
  }
  opCode00EE(/* opcode */) {
    this.sp = (this.sp - 1) & (this.stack.length - 1);
    this.pc = this.stack[this.sp];
  }
  // opCode0NNN(/* opcode */) {
  //   console.log("0NNN is not implemented");
  //   //this.opCode2NNN(opcode);
  //   // this.opCode2NNN(opcode);
  //   // this._advance2();
  // }
  opCode1NNN(opcode) {
    this.pc = opcode.NNN;
  }
  opCode2NNN(opcode) {
    this.stack[this.sp] = this.pc;
    this.sp = (this.sp + 1) & (this.stack.length - 1);
    this.pc = opcode.NNN;
  }
  opCode3XNN(opcode) {
    if (this.v[opcode.X] === opcode.NN) this._advance2();
  }
  opCode4XNN(opcode) {
    if (this.v[opcode.X] !== opcode.NN) this._advance2();
  }
  opCode5XY0(opcode) {
    if (this.v[opcode.X] === this.v[opcode.Y]) this._advance2();
  }
  opCode6XNN(opcode) {
    this.v[opcode.X] = opcode.NN;
  }
  opCode7XNN(opcode) {
    this.v[opcode.X] += opcode.NN;
  }
  opCode8XY0(opcode) {
    this.v[opcode.X] = this.v[opcode.Y];
  }
  opCode8XY1(opcode) {
    this.v[opcode.X] |= this.v[opcode.Y];
  }
  opCode8XY2(opcode) {
    this.v[opcode.X] &= this.v[opcode.Y];
  }
  opCode8XY3(opcode) {
    this.v[opcode.X] ^= this.v[opcode.Y];
  }
  opCode8XY4(opcode) {
    this.v[opcode.X] += this.v[opcode.Y]; // This can be > 255
    // The values of Vx and Vy are added together. If the result is greater than 8 bits (i.e., > 255,) VF is set to 1, otherwise 0. Only the lowest 8 bits of the result are kept, and stored in Vx.
    // https://github.com/alexanderdickson/Chip-8-Emulator/blob/master/scripts/chip8.js | vF carry 1 or 0 | Line 324
    this.v[0xf] = +(this.v[opcode.X] > 255); // + turns false, true to 0 or 1
  }
  opCode8XY5(opcode) {
    // If Vx > Vy, then VF is set to 1, otherwise 0. Then Vy is subtracted from Vx, and the results stored in Vx.
    this.v[0xf] = +(this.v[opcode.X] >= this.v[opcode.Y]);
    this.v[opcode.X] -= this.v[opcode.Y]; // Same case vX could be < 0
  }
  opCode8XY6(opcode) {
    const lsb = this.v[opcode.X] & 0x01;
    this.v[0xf] = lsb;
    this.v[opcode.X] = this.v[opcode.X] >> 1;
  }
  opCode8XY7(opcode) {
    this.v[0xf] = +(this.v[opcode.Y] >= this.v[opcode.X]);
    this.v[opcode.X] = this.v[opcode.Y] - this.v[opcode.X];
  }
  opCode8XYE(opcode) {
    const msb = (this.v[opcode.X] >> 7) & 0x01;
    this.v[0xf] = msb;
    this.v[opcode.X] = this.v[opcode.X] << 1;
  }
  opCode9XY0(opcode) {
    if (this.v[opcode.X] != this.v[opcode.Y]) this._advance2();
  }
  opCodeANNN(opcode) {
    this.i = opcode.NNN;
  }
  opCodeBNNN(opcode) {
    this.pc = (this.v[0] + opcode.NNN) & 0x0fff;
  }
  opCodeCXNN(opcode) {
    this.v[opcode.X] = Math.floor(Math.random() * (0xff + 1)) & opcode.NN;
  }
  opCodeDXYN(opcode) {
    const rowWidth = 8;
    const numberOfRow = opcode.N;
    this.logs.push("DISPLAY: ", this.v[opcode.X], this.v[opcode.Y], opcode);
    this.v[0xf] = 0;
    for (let i = 0; i < numberOfRow; i++) {
      const rowBits = this.memory[this.i + i];
      for (let j = 0; j < rowWidth; j++) {
        const bit = rowBits & (0x80 >> j);
        if (bit) {
          let collision = this.display.pixelRender(
            this.v[opcode.X] + j,
            this.v[opcode.Y] + i
          );
          if (collision) this.v[0xf] = 1;
        }
      }
    }
    this.display.render();
  }
  opCodeEX9E(opcode) {
    if (this.keyboard.isKey(this.v[opcode.X])) this._advance2();
  }
  opCodeEXA1(opcode) {
    if (!this.keyboard.isKey(this.v[opcode.X])) this._advance2();
  }
  opCodeFX07(opcode) {
    this.v[opcode.X] = this.delay_timer;
  }
  opCodeFX0A(opcode) {
    this.pause();
    const that = this;
    this.keyboard.sendKey = function(key) {
      if (key) {
        that.v[opcode.X] = key;
        that.resume();
        this.sendKey = function() {};
      }
    };
  }
  opCodeFX15(opcode) {
    this.delay_timer = this.v[opcode.X];
  }
  opCodeFX18(opcode) {
    this.sound_timer = this.v[opcode.X];
  }
  opCodeFX1E(opcode) {
    this.i = (this.i + this.v[opcode.X]) & 0xfff;
  }
  opCodeFX29(opcode) {
    this.i = this.v[opcode.X] * 5;
  }
  opCodeFX33(opcode) {
    let bcd = this.v[opcode.X];
    this.memory[this.i] = parseInt(bcd / 100, 10);
    this.memory[this.i + 1] = parseInt((bcd % 100) / 10, 10);
    this.memory[this.i + 2] = bcd % 10;
  }
  opCodeFX55(opcode) {
    for (let i = 0; i <= opcode.X; i++) {
      this.memory[this.i + i] = this.v[i];
    }
  }
  opCodeFX65(opcode) {
    for (let i = 0; i <= opcode.X; i++) {
      this.v[i] = this.memory[this.i + i];
    }
  }

  opcodeTable() {
    return [
      // [/* 0X0NNN */ 0x0000, 0xf000, this.opCode0NNN] /*  - SYS addr */,
      [/* 0X00E0 */ 0x00e0, 0xffff, this.opCode00E0] /*  - CLS */,
      [/* 0X00EE */ 0x00ee, 0xffff, this.opCode00EE] /*  - RET */,
      [/* 0X1NNN */ 0x1000, 0xf000, this.opCode1NNN] /*  - JP addr */,
      [/* 0X2NNN */ 0x2000, 0xf000, this.opCode2NNN] /*  - CALL addr */,
      [/* 0X3XNN */ 0x3000, 0xf000, this.opCode3XNN] /*  - SE Vx, byte */,
      [/* 0X4XNN */ 0x4000, 0xf000, this.opCode4XNN] /*  - SNE Vx, byte */,
      [/* 0X5XY0 */ 0x5000, 0xf00f, this.opCode5XY0] /*  - SE Vx, Vy */,
      [/* 0X6XNN */ 0x6000, 0xf000, this.opCode6XNN] /*  - LD Vx, byte */,
      [/* 0X7XNN */ 0x7000, 0xf000, this.opCode7XNN] /*  - ADD Vx, byte */,
      [/* 0X8XY0 */ 0x8000, 0xf00f, this.opCode8XY0] /*  - LD Vx, Vy */,
      [/* 0X8XY1 */ 0x8001, 0xf00f, this.opCode8XY1] /*  - OR Vx, Vy */,
      [/* 0X8XY2 */ 0x8002, 0xf00f, this.opCode8XY2] /*  - AND Vx, Vy */,
      [/* 0X8XY3 */ 0x8003, 0xf00f, this.opCode8XY3] /*  - XOR Vx, Vy */,
      [/* 0X8XY4 */ 0x8004, 0xf00f, this.opCode8XY4] /*  - ADD Vx, Vy */,
      [/* 0X8XY5 */ 0x8005, 0xf00f, this.opCode8XY5] /*  - SUB Vx, Vy */,
      [/* 0X8XY6 */ 0x8006, 0xf00f, this.opCode8XY6] /*  - SHR Vx [, Vy] */,
      [/* 0X8XY7 */ 0x8007, 0xf00f, this.opCode8XY7] /*  - SUBN Vx, Vy */,
      [/* 0X8XYE */ 0x800e, 0xf00f, this.opCode8XYE] /*  - SHL Vx [, Vy] */,
      [/* 0X9XY0 */ 0x9000, 0xf00f, this.opCode9XY0] /*  - SNE Vx, Vy */,
      [/* 0XANNN */ 0xa000, 0xf000, this.opCodeANNN] /*  - LD I, addr */,
      [/* 0XBNNN */ 0xb000, 0xf000, this.opCodeBNNN] /*  - JP V0, addr */,
      [/* 0XCXNN */ 0xc000, 0xf000, this.opCodeCXNN] /*  - RND Vx, byte */,
      [
        /* 0XDXYN */ 0xd000,
        0xf000,
        this.opCodeDXYN
      ] /*  - DRW Vx, Vy, nibble */,
      [/* 0XEX9E */ 0xe09e, 0xf0ff, this.opCodeEX9E] /*  - SKP Vx */,
      [/* 0XEXA1 */ 0xe0a1, 0xf0ff, this.opCodeEXA1] /*  - SKNP Vx */,
      [/* 0XFX07 */ 0xf007, 0xf0ff, this.opCodeFX07] /*  - LD Vx, DT */,
      [/* 0XFX0A */ 0xf00a, 0xf0ff, this.opCodeFX0A] /*  - LD Vx, K */,
      [/* 0XFX15 */ 0xf015, 0xf0ff, this.opCodeFX15] /*  - LD DT, Vx */,
      [/* 0XFX18 */ 0xf018, 0xf0ff, this.opCodeFX18] /*  - LD ST, Vx */,
      [/* 0XFX1E */ 0xf01e, 0xf0ff, this.opCodeFX1E] /*  - ADD I, Vx */,
      [/* 0XFX29 */ 0xf029, 0xf0ff, this.opCodeFX29] /*  - LD F, Vx */,
      [/* 0XFX33 */ 0xf033, 0xf0ff, this.opCodeFX33] /*  - LD B, Vx */,
      [/* 0XFX55 */ 0xf055, 0xf0ff, this.opCodeFX55] /*  - LD [I], Vx */,
      [/* 0XFX65 */ 0xf065, 0xf0ff, this.opCodeFX65] /*  - LD Vx, [I] */
    ];
  }

  de(opcode) {
    return {
      NNN: opcode & 0x0fff,
      NN: opcode & 0x00ff,
      N: opcode & 0x000f,
      X: (opcode & 0x0f00) >> 8,
      Y: (opcode & 0x00f0) >> 4
    };
  }
  _advance2() {
    this.pc = (this.pc + 2) & 0x0fff;
  }
}

module.exports = Chip8;
