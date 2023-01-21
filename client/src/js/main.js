import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { io } from "socket.io-client";
import ClientState from "./ClientState";
import { isMoving } from "./utils";
import InputController from "./InputController";

const developmentEndpoint = ":8080";
const productionEndpoint = import.meta.env.VITE_ENDPOINT;

const socket = io(
  import.meta.env.MODE === "production"
    ? productionEndpoint
    : developmentEndpoint
);

let camera, scene, renderer, controls, clientState, inputController;

// TODO: What're these for?
// const objects = [];
// let raycaster;

let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

init();
animate();

function init() {
  inputController = new InputController();
  inputController.init();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.y = 10;

  scene = new THREE.Scene();

  const loader = new GLTFLoader();

  loader.load(
    `${import.meta.env.BASE_URL}models/poly.gltf`,
    function (gltf) {
      gltf.scene.scale.set(10, 10, 10);
      gltf.scene.position.set(0, 21, 0);
      scene.add(gltf.scene);
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );

  scene.background = new THREE.Color(0xffffff);
  scene.fog = new THREE.Fog(0xffffff, 0, 200);

  const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);

  controls = new PointerLockControls(camera, document.body);

  const blocker = document.getElementById("blocker");
  const instructions = document.getElementById("instructions");

  instructions.addEventListener("click", () => {
    controls.lock();
  });

  controls.addEventListener("lock", () => {
    instructions.style.display = "none";
    blocker.style.display = "none";
  });

  controls.addEventListener("unlock", () => {
    blocker.style.display = "block";
    instructions.style.display = "";
  });

  scene.add(controls.getObject());

  // TODO: What's ths for?
  // raycaster = new THREE.Raycaster(
  //   new THREE.Vector3(),
  //   new THREE.Vector3(0, -1, 0),
  //   0,
  //   10
  // );

  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //

  window.addEventListener("resize", onWindowResize);

  socket.on("connect", () => {
    console.log(`user ${socket.id} has connected`);
    clientState = new ClientState(socket.id, scene);
  });

  socket.on("currentLocations", (locations) => {
    clientState.movePlayerAvatars(locations);
  });

  socket.on("introduction", (clientIds, clientPositions) => {
    clientState.setConnectedUsers(clientIds);
    clientState.createPlayerAvatars(clientPositions);
  });

  socket.on("disconnectUser", (id, connectedPlayerIds) => {
    clientState.deletePlayerAvatar(id);
    clientState.setConnectedUsers(connectedPlayerIds);
  });

  // TODO: consolidate this by setting a flag
  controls.addEventListener("change", () => {
    socket.emit("move", {
      [clientState.getClientId()]: {
        position: [
          controls.getObject().position.x,
          controls.getObject().position.y,
          controls.getObject().position.z,
        ],
        rotation: [
          controls.getObject().rotation.x,
          controls.getObject().rotation.y,
          controls.getObject().rotation.z,
        ],
      },
    });
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  const { moveForward, moveBackward, moveLeft, moveRight, jump } =
    inputController.getState();

  requestAnimationFrame(animate);

  const time = performance.now();

  if (controls.isLocked === true) {
    // TODO: What're these lines for?
    // raycaster.ray.origin.copy(controls.getObject().position);
    // raycaster.ray.origin.y -= 10;
    // const intersections = raycaster.intersectObjects(objects, false);
    // const onObject = intersections.length > 0;

    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    // Jump only when allowed and input pressed
    if (canJump === true && jump) {
      velocity.y += 350;
      canJump = false;
    }

    // TODO: We don't have object intersections yet, so this never runs
    // TODO: What's this for?
    // if (onObject === true) {
    //   velocity.y = Math.max(0, velocity.y);
    //   canJump = true;
    // }

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    controls.getObject().position.y += velocity.y * delta; // new behavior

    if (controls.getObject().position.y < 10) {
      velocity.y = 0;
      controls.getObject().position.y = 10;

      canJump = true;
    }
  }

  // Only emit coordinates if the user is moving
  if (isMoving(velocity) && clientState !== undefined) {
    socket.emit("move", {
      [clientState.getClientId()]: {
        position: [
          controls.getObject().position.x,
          controls.getObject().position.y,
          controls.getObject().position.z,
        ],
        rotation: [
          controls.getObject().rotation.x,
          controls.getObject().rotation.y,
          controls.getObject().rotation.z,
        ],
      },
    });
  }

  prevTime = time;

  renderer.render(scene, camera);
}
