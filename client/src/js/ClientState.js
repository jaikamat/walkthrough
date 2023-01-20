import Avatar from "./Avatar";

class ClientState {
  constructor(clientId, scene) {
    // Retain a reference to the threejs context
    this._scene = scene;
    this._clientId = clientId;
    this._playerAvatars = {};
  }

  setConnectedUsers(connectedUsers) {
    this._connectedUsers = connectedUsers;
  }

  setPlayerAvatar(avatar) {
    const id = avatar.getId();
    this._playerAvatars[id] = avatar;
  }

  getConnectedUsers() {
    return this._connectedUsers;
  }

  getOtherConnectedUsers() {
    return this.getConnectedUsers().filter((id) => id !== this.getClientId());
  }

  getClientId() {
    return this._clientId;
  }

  createPlayerAvatar(playerId) {
    const avatar = new Avatar(this._scene);
    avatar.init(playerId);
    this.setPlayerAvatar(avatar);
  }

  createPlayerAvatars(clientPositions) {
    this.getOtherConnectedUsers().forEach((id) => {
      // Only create a new avatar if the player is not part of current state
      if (!this.getPlayerAvatar(id)) {
        this.createPlayerAvatar(id, clientPositions[id]);
      }
    });
  }

  getPlayerAvatar(id) {
    return this._playerAvatars[id];
  }

  movePlayerAvatar(playerId, newLocation) {
    // TODO: Sometimes `avatar` is undefined...not sure why
    const avatar = this.getPlayerAvatar(playerId);
    if (avatar) {
      avatar.move(newLocation);
    }
  }

  movePlayerAvatars(positions) {
    this.getOtherConnectedUsers().forEach((id) => {
      this.movePlayerAvatar(id, positions[id]);
    });
  }

  deletePlayerAvatar(playerId) {
    const avatar = this.getPlayerAvatar(playerId);
    avatar.destroy();
    delete this._playerAvatars[playerId];
  }

  removePlayer(playerId) {
    const newConnectedUsers = this.getConnectedUsers().filter(
      (id) => id !== playerId
    );
    this.setConnectedUsers(newConnectedUsers);
    this.deletePlayerAvatar(playerId);
  }
}

export default ClientState;
