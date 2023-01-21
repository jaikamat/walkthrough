import * as THREE from "three";
import InputController from "./InputController";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

class FirstPersonControls {
  constructor(camera, scene) {
    // Maintain a link to the threejs context
    this._scene = scene;
    this._camera = camera;
    this._controls = new PointerLockControls(camera, document.body);
    this._velocity = new THREE.Vector3();
    this._direction = new THREE.Vector3();
    this._canJump = false;
    this._inputController = new InputController();
    this._prevTime = performance.now();

    this.init();
  }

  getControls() {
    return this._controls;
  }

  getVelocity() {
    return this._velocity;
  }

  getCurrentPosition() {
    return {
      position: [
        this._controls.getObject().position.x,
        this._controls.getObject().position.y,
        this._controls.getObject().position.z,
      ],
      rotation: [
        this._controls.getObject().rotation.x,
        this._controls.getObject().rotation.y,
        this._controls.getObject().rotation.z,
      ],
    };
  }

  init() {
    this._camera.position.y = 10;
    this._scene.add(this._controls.getObject());

    // TODO: extract this out? Not sure
    const blocker = document.getElementById("blocker");
    const instructions = document.getElementById("instructions");

    instructions.addEventListener("click", () => {
      this._controls.lock();
    });

    this._controls.addEventListener("lock", () => {
      instructions.style.display = "none";
      blocker.style.display = "none";
    });

    this._controls.addEventListener("unlock", () => {
      blocker.style.display = "block";
      instructions.style.display = "";
    });
  }

  update() {
    const { moveForward, moveBackward, moveLeft, moveRight, jump } =
      this._inputController.getState();

    const time = performance.now();

    if (this._controls.isLocked === true) {
      // TODO: What're these lines for?
      // raycaster.ray.origin.copy(controls.getObject().position);
      // raycaster.ray.origin.y -= 10;
      // const intersections = raycaster.intersectObjects(objects, false);
      // const onObject = intersections.length > 0;

      const delta = (time - this._prevTime) / 1000;

      this._velocity.x -= this._velocity.x * 10.0 * delta;
      this._velocity.z -= this._velocity.z * 10.0 * delta;

      this._velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

      this._direction.z = Number(moveForward) - Number(moveBackward);
      this._direction.x = Number(moveRight) - Number(moveLeft);
      this._direction.normalize(); // this ensures consistent movements in all directions

      if (moveForward || moveBackward)
        this._velocity.z -= this._direction.z * 400.0 * delta;
      if (moveLeft || moveRight)
        this._velocity.x -= this._direction.x * 400.0 * delta;

      // Jump only when allowed and input pressed
      if (this._canJump === true && jump) {
        this._velocity.y += 350;
        this._canJump = false;
      }

      this._controls.moveRight(-this._velocity.x * delta);
      this._controls.moveForward(-this._velocity.z * delta);

      this._controls.getObject().position.y += this._velocity.y * delta; // new behavior

      if (this._controls.getObject().position.y < 10) {
        this._velocity.y = 0;
        this._controls.getObject().position.y = 10;

        this._canJump = true;
      }
    }

    this._prevTime = time;
  }
}

export default FirstPersonControls;
