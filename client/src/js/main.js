import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { io } from "socket.io-client";

const developmentEndpoint = ":8080";
const productionEndpoint = import.meta.env.VITE_ENDPOINT;

const socket = io(
  import.meta.env.MODE === "production"
    ? productionEndpoint
    : developmentEndpoint
);

// TODO:
// We need to create a new sphere each time a player connects
// On socket update: create a new sphere.
const spheres = [];

// Set the client's unique identifier to send to the server
// const uuid = uuidv4();

let socketIdentifier;

// State object which holds all user's x and z locations
let userLocations = {};
let connectedUsers = [];

let camera, scene, renderer, controls, sphere;

const objects = [];

let raycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

init();
animate();

function init() {
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

  //

  const sphereGeometry = new THREE.SphereGeometry(5, 32, 16);
  const material = new THREE.MeshBasicMaterial({
    color: 0xfff,
  });
  sphere = new THREE.Mesh(sphereGeometry, material);
  scene.add(sphere);

  //

  scene.background = new THREE.Color(0xffffff);
  scene.fog = new THREE.Fog(0xffffff, 0, 200);

  const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);

  controls = new PointerLockControls(camera, document.body);

  const blocker = document.getElementById("blocker");
  const instructions = document.getElementById("instructions");

  instructions.addEventListener("click", function () {
    controls.lock();
  });

  controls.addEventListener("lock", function () {
    instructions.style.display = "none";
    blocker.style.display = "none";
  });

  controls.addEventListener("unlock", function () {
    blocker.style.display = "block";
    instructions.style.display = "";
  });

  scene.add(controls.getObject());

  const onKeyDown = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = true;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = true;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = true;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = true;
        break;

      case "Space":
        if (canJump === true) velocity.y += 350;
        canJump = false;
        break;
    }
  };

  const onKeyUp = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = false;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = false;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = false;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = false;
        break;
    }
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, -1, 0),
    0,
    10
  );

  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //

  window.addEventListener("resize", onWindowResize);

  //

  /**
   * Initialize a listener to update user state object when server emits events
   */
  socket.on("connect", () => {
    console.log("a user has connected");
    console.log("socketid: ", socket.id);
    socketIdentifier = socket.id;
  });

  // Also send a list of connected UUID's?
  socket.on("locationUpdate", (value) => {
    userLocations = { ...userLocations, ...value };
    // Delete this client's identifier information to eliminate redundancy
    // TODO: can this just be done server side via broadcast?
    delete userLocations[socketIdentifier];
    console.log(userLocations);
  });

  socket.on("connectedUsers", (value) => {
    connectedUsers = value;
    console.log("current socketId", socket.id);
    console.log("connectedUsers", connectedUsers);
  });

  //
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  //

  // Set the sphere's position based on the other user's state

  sphere.position.x = Object.values(userLocations)[0]?.x;
  sphere.position.z = Object.values(userLocations)[0]?.z;

  // TODO: Remove
  // console.log("entries", JSON.stringify(Object.values(userLocations)[0]));

  // As the animation loops, emit the current player's location
  if (socketIdentifier !== undefined) {
    socket.emit("locationUpdate", {
      [socketIdentifier]: {
        x: controls.getObject().position.x,
        z: controls.getObject().position.z,
      },
    });
  }

  //

  const time = performance.now();

  if (controls.isLocked === true) {
    raycaster.ray.origin.copy(controls.getObject().position);
    raycaster.ray.origin.y -= 10;

    const intersections = raycaster.intersectObjects(objects, false);

    const onObject = intersections.length > 0;

    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    if (onObject === true) {
      velocity.y = Math.max(0, velocity.y);
      canJump = true;
    }

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    controls.getObject().position.y += velocity.y * delta; // new behavior

    if (controls.getObject().position.y < 10) {
      velocity.y = 0;
      controls.getObject().position.y = 10;

      canJump = true;
    }
  }

  prevTime = time;

  renderer.render(scene, camera);
}
