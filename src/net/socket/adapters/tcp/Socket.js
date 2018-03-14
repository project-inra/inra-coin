// @flow
import net, { Socket } from "net";
import { SocketInterface } from "../AdapterInterface";
import type { PeerAddress } from "../AdapterInterface";

/**
 * @namespace   tcp
 * @memberof    socket.adapters
 * @extends     EventEmitter
 * @class
 */
class TcpSocket implements SocketInterface {
  id: PeerAddress;
  host: string;
  port: number;

  reconnectRetries: number = 0;
  reconnectTimeout: TimeoutID;

  // Socket used once connection is established:
  socket: Socket | null;
  // Socket used for establishing connection:
  pendingSocket: Socket | null;

  constructor(peerId: PeerAddress): void {
    this.id = peerId;
  }

  /**
   * Tries to establish a new connection (at this time, the connection isn't ACK
   * by the remote host – thay's why it's a pending socket).
   *
   * @return  {Socket}
   */
  connect(): Socket {
    const socket = net.connect(this.port, this.host);
    this.setPendingSocket(socket);

    return socket;
  }

  /**
   * Writes a message.
   *
   * @param   {Buffer|string}   chunk
   * @return  {void}
   */
  write(chunk: Buffer | string): void {
    // In case it is closed:
    if (this.socket && this.socket.writable) {
      this.socket.write(chunk);
    }
  }

  /**
   * Destroys the (pending)socket and clears the reconnect timeout.
   *
   * @return  {void}
   */
  disconnect(): void {
    if (this.pendingSocket) this.pendingSocket.destroy();
    if (this.socket) this.socket.destroy();

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
