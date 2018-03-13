// @flow
import { Socket } from "net";

export type PeerAddress = string;

export interface SocketInterface {
  write(message: string): void;
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
