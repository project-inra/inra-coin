// @flow

export type PeerAddress = string;

export interface SocketInterface {
  // Writtes a message
  write(chunk: Buffer | string): void;
  // Destroys socket
  disconnect(): void;
}

export interface ServerInterface {
  // Add a peer to the created topology
  connect(address: PeerAddress): void;
  // Removes a peer from the created topology
  disconnect(address: PeerAddress): void;
  // Destroys the topology and all connections
  destroy(): void;
}
