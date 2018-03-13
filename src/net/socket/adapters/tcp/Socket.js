// @flow
import net, { Socket } from "net";
import { SocketInterface } from "../AdapterInterface";
import type { PeerAddress } from "../AdapterInterface";

class TcpSocket implements SocketInterface {
  id: PeerAddress;
  host: string;
  port: number;

  reconnectRetries: number = 0;
  reconnectTimeout: TimeoutID;

  socket: Socket | null;
  pendingSocket: Socket | null;

  constructor(peerId: PeerAddress): void {
    this.id = peerId;
  }

  connect(): Socket {
    return net.connect(this.port, this.host);
  }

  write(message: string): void {
    // In case it is closed:
    if (this.socket && this.socket.writable) {
      this.socket.write(message);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.destroy();
    }

    if (this.pendingSocket) {
      this.pendingSocket.destroy();
    }

    clearTimeout(this.reconnectTimeout);
  }

  setHost(host: string): void {
    this.host = host;
  }

  setPort(port: number): void {
    this.port = port;
  }

  setSocket(socket: Socket | null): void {
    if (this.socket) {
      this.socket.destroy();
    }

    this.socket = socket;
  }

  setPendingSocket(socket: Socket | null): void {
    // if (this.pendingSocket) {
    //   this.pendingSocket.destroy();
    // }

    this.pendingSocket = socket;
  }

  setReconnectRetries(retries: number): void {
    this.reconnectRetries = retries;
  }

  setReconnectTimeout(callback: Function | null): void {
    if (callback) {
      this.reconnectTimeout = setTimeout(callback, this.reconnectRetries * 200);
    } else if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
  }
}

export default TcpSocket;
