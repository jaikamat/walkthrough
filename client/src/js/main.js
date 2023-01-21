import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { io } from "socket.io-client";
import ClientState from "./ClientState";
import { isMoving } from "./utils";
import FirstPersonControls from "./FirstPersonControls";

const developmentEndpoint = ":8080";
const productionEndpoint = import.meta.env.VITE_ENDPOINT;

const socket = io(
  import.meta.env.MODE === "production"
    ? productionEndpoint
    : developmentEndpoint
);

let camera, scene, renderer, clientState, firstPersonControls;

init();
animate();

function init() {
  const loader = new GLTFLoader();
  scene = new THREE.Scene();
  const aspectRatio = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(75, aspectRatio, 1, 1000);
  camera.position.y = 10;

  firstPersonControls = new FirstPersonControls(camera, scene);

  loader.load(
    `${import.meta.env.BASE_URL}models/poly.gltf`,
    (gltf) => {
      gltf.scene.scale.set(10, 10, 10);
      gltf.scene.position.set(0, 21, 0);
      scene.add(gltf.scene);
    },
    undefined,
    (error) => {
      console.error(error);
    }
  );

  scene.background = new THREE.Color(0xffffff);
  scene.fog = new THREE.Fog(0xffffff, 0, 200);

  const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", onWindowResize);

  // TODO: extract a socket controller class?
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

  // TODO: consolidate this by setting a flag?
  // TODO: does this belong in the firstPersonControls class?
  firstPersonControls.getControls().addEventListener("change", () => {
    socket.emit("move", {
      [clientState.getClientId()]: firstPersonControls.getCurrentPosition(),
    });
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  firstPersonControls.update();

  // Only emit coordinates if the user is moving
  // TODO: does this belong in the firstPersonControls class?
  if (
    isMoving(firstPersonControls.getVelocity()) &&
    clientState !== undefined
  ) {
    socket.emit("move", {
      [clientState.getClientId()]: firstPersonControls.getCurrentPosition(),
    });
  }

  renderer.render(scene, camera);
}
