import * as THREE from "three";

class Avatar {
  // Retain a reference to the threejs context
  constructor(scene) {
    this._scene = scene;
  }

  generateMesh() {
    const geometry = new THREE.BoxGeometry(8, 8, 8);
    const material = new THREE.MeshNormalMaterial();
    const sphere = new THREE.Mesh(geometry, material);

    return sphere;
  }

  getId() {
    return this._id;
  }

  // Side effect
  attachToScene() {
    this._scene.add(this._mesh);
  }

  // Side effect
  removeFromScene() {
    this._scene.remove(this._mesh);
  }

  init(id) {
    this._id = id;
    this._mesh = this.generateMesh();
    this.attachToScene();
  }

  move(newLocation) {
    const [x, y, z] = newLocation.position;
    const [yaw, pitch, roll] = newLocation.rotation;
    this._mesh.position.set(x, y, z);
    this._mesh.rotation.set(yaw, pitch, roll);
  }

  rotate(newRotation) {
    const [x, y, z] = newRotation;
    this._mesh.rotation.set(x, y, z);
  }

  destroy() {
    this.removeFromScene();
  }
}

export default Avatar;
