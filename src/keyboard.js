class Keyboard {
  constructor(chip8) {
    this.map = null;
    this.keys = null;
    this.chip8 = chip8;
    this.reset();
  }
  reset() {
    this.keyMap();

    this.keys = {};

    this.sendKey = function() {};

    Object.values(this.map).forEach((value, index) => {
      this.keys[value] = false;
    });

    window.removeEventListener("keyup", this.keyUp);
    window.removeEventListener("keydown", this.keyDown);

    window.addEventListener(
      "keyup",
      function(event) {
        this.keyUp(event);
      }.bind(this),
      false
    );
    window.addEventListener(
      "keydown",
      function(event) {
        this.keyDown(event);
      }.bind(this),
      false
    );
  }
  keyUp(event) {
    if (event.isComposing || event.keyCode) {
      if (this.map[event.keyCode]) this.keys[this.map[event.keyCode]] = false;
    }
  }
  keyDown(event) {
    if (event.isComposing || event.keyCode) {
      this.keys[this.map[event.keyCode]] = true;
      this.sendKey(this.map[event.keyCode]);
      this.sendKey = function() {};
    } else {
      console.error("This key is not mapped", event.keyCode);
    }
  }
  keyMap() {
    this.map = {
      48: 0x0,
      49: 0x1,
      50: 0x2,
      51: 0x3,
      52: 0x4,
      53: 0x5,
      54: 0x6,
      55: 0x7,
      56: 0x8,
      57: 0x9,
      65: 0xa,
      66: 0xb,
      67: 0xc,
      68: 0xd,
      69: 0xe,
      70: 0xf
    };
  }
  sendKey(key) {
    void key;
  }
  isKey(key) {
    return !!this.keys[key];
  }
}

module.exports = Keyboard;
