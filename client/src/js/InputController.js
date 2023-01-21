class InputController {
  constructor() {
    this._moveForward = false;
    this._moveBackward = false;
    this._moveLeft = false;
    this._moveRight = false;
    this._jump = false;

    this.init();
  }

  getState() {
    return {
      moveForward: this._moveForward,
      moveBackward: this._moveBackward,
      moveLeft: this._moveLeft,
      moveRight: this._moveRight,
      jump: this._jump,
    };
  }

  onKeyDown = (event) => {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        this._moveForward = true;
        break;

      case "ArrowLeft":
      case "KeyA":
        this._moveLeft = true;
        break;

      case "ArrowDown":
      case "KeyS":
        this._moveBackward = true;
        break;

      case "ArrowRight":
      case "KeyD":
        this._moveRight = true;
        break;

      case "Space":
        this._jump = true;
        break;
    }
  };

  onKeyUp = (event) => {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        this._moveForward = false;
        break;

      case "ArrowLeft":
      case "KeyA":
        this._moveLeft = false;
        break;

      case "ArrowDown":
      case "KeyS":
        this._moveBackward = false;
        break;

      case "ArrowRight":
      case "KeyD":
        this._moveRight = false;
        break;

      case "Space":
        this._jump = false;
        break;
    }
  };

  init() {
    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
  }
}

export default InputController;
