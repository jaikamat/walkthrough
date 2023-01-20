import * as THREE from "three";

class Avatar {
  // Retain a reference to the threejs context
  constructor(scene) {
    this._scene = scene;
  }

  generateMesh() {
    const sphereGeometry = new THREE.SphereGeometry(5, 32, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xfff });
    const sphere = new THREE.Mesh(sphereGeometry, material);

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

  move(newPosition) {
    const [x, y, z] = newPosition;
    this._mesh.position.set(x, y, z);
  }

  destroy() {
    this.removeFromScene();
  }
}

export default Avatar;
