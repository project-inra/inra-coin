// @flow
import net, { Server, Socket } from "net";
import lpm from "length-prefixed-message";
import EventEmitter from "events";
import networkAddress from "network-address";
import { ServerInterface } from "../AdapterInterface";
import type { PeerAddress } from "../AdapterInterface";
import TcpSocket from "./Socket";

// For debugging purposes only. We should switch to a standalone module:
const debug = console.log;

type Config = {
  port: number,
  host?: string,
  handshake?: number
};

/**
 * TCP Server provides an asynchronous network API for creating stream based TCP
 * (or IPC) servers.
 *
 * @namespace   signal
 * @memberof    net
 * @extends     EventEmitter
 * @class
 */
class TcpServer extends EventEmitter implements ServerInterface {
  // Local network address of the machine (IPv4):
  local: PeerAddress = networkAddress();

  // Peers we are connected to:
  peers: Map<PeerAddress, TcpSocket> = new Map();

  // Server instance:
  server: Server;
  config: Config;

  constructor(config: Config): void {
    super();

    if (config.host) {
      this.local = `${config.host}:${config.port}`;
    } else {
      this.local += `:${config.port}`;
    }

    this.config = config;
    this.server = net.createServer(this.handleNewConnection.bind(this));
    this.server.listen(this.config.port);

    debug("Created a new TCP server", this.local);
  }

  /**
   * Adds a peer to the topology and establishes a TCP connection.
   *
   * @param   {PeerAddress}   address
   * @return  {void}
   */
  connect(address: PeerAddress): void {
    if (address === this.local)
      throw new Error("Cannot connect to local machine");

    if (this.peers.has(address))
      throw new Error(`Already connected to ${address}`);

    const peer = this.addPeer(address);
    peer.setHost(String(address.split(":")[0]));
    peer.setPort(Number(address.split(":")[1]));

    this.createConnection(peer);
  }

  /**
   * Removes a peer from the created topology.
   *
   * @param   {PeerAddress}  address
   * @return  {void}
   */
  disconnect(address: PeerAddress): void {
    if (address === this.local) {
      debug("If you want to disconnect local machine, use `.destroy()`");
      return;
    }

    if (!this.peers.has(address)) {
      debug(`Cannot find peer with ID ${address}`);
      return;
    }

    // $FlowFixMe: .get returns a valid TcpSocket (check above)
    this.peers.get(address).disconnect();
    this.peers.delete(address);
  }

  /**
   * Closes the server and disconnects each peer.
   *
   * @return  {void}
   */
  destroy(): void {
    if (this.server.listening) {
      this.server.close();
    }

    // Disconnect each peer:
    Object.keys(this.peers).forEach(this.disconnect.bind(this));
  }

  /**
   * Returns the TCP Socket for a given address. Creates it first, if it isn't
   * present in the list.
   *
   * @param   {PeerAddress}   address
   * @return  {TcpSocket}
   * @access  private
   */
  addPeer(address: PeerAddress): TcpSocket {
    if (!this.peers.has(address)) {
      this.peers.set(address, new TcpSocket(address));
    }

    // $FlowFixMe: .get returns a valid TcpSocket (check above)
    return this.peers.get(address);
  }

  /**
   * Handles an incomming connection.
   *
   * @param   {Socket}  socket
   * @return  {void}
   * @access  private
   */
  handleNewConnection(socket: Socket): void {
    this.handleError(socket);

    lpm.read(socket, address => {
      const from = address.toString();
      const peer = this.addPeer(from);

      if (from > this.local) {
        this.createConnection(peer, socket);
      } else {
        lpm.write(socket, this.local);
        this.handleReconnect(peer, socket);
        this.handleReady(peer, socket);
      }
    });
  }

  /**
   * @param   {TcpSocket} peer
   * @param   {Socket?}   socket
   * @return  {void}
   * @access  private
   */
  createConnection(peer: TcpSocket, socket?: Socket): void {
    if (peer.socket || peer.pendingSocket) return socket && socket.destroy();
    if (peer.reconnectTimeout) peer.setReconnectTimeout(null);
    if (!socket) socket = peer.connect();

    lpm.write(socket, this.local);
    peer.setPendingSocket(socket);

    if (this.local > peer.id) {
      this.handleNewConnection(socket);
    } else {
      this.handleError(socket);
      this.handleReconnect(peer, socket);

      lpm.read(socket, data => {
        // debug(data, data.toString());

        // @$FlowFixMe Not sure why there's an error here
        this.handleReady(peer, socket);
      });
    }
  }

  /**
   * @param   {TcpSocket} peer
   * @param   {Socket?}   socket
   * @return  {void}
   * @access  private
   */
  handleReady(peer: TcpSocket, socket: Socket): void {
    // Reset timeout:
    socket.setTimeout(0);

    peer.setReconnectRetries(0);
    peer.setSocket(socket);
    peer.setPendingSocket(null);

    this.emit("connection", peer.socket, peer.id);
  }

  handleError(socket: Socket): void {
    socket.setTimeout(this.config.handshake || 20000, () => {
      debug("Could not connect: Timeout");
      socket.destroy();
    });

    socket.on("error", err => {
      debug("Could not connect: ", err.message);
      socket.destroy();
    });
  }

  handleReconnect(peer: TcpSocket, socket: Socket): void {
    socket.on("close", () => {
      if (peer.pendingSocket === socket) peer.setPendingSocket(null);
      if (peer.socket === socket) peer.setSocket(null);
      if (peer.socket) return;

      // @todo delete from the list

      const reconnect = () => this.createConnection(peer);
      peer.setReconnectRetries(peer.reconnectRetries + 1);
      peer.setReconnectTimeout(reconnect);

      this.emit("reconnect", peer.id, peer.reconnectRetries);
    });
  }

  get connections(): Array<TcpSocket> {
    return Array.from(this.peers.values()).filter(
      socket => socket instanceof TcpSocket
    );
  }
}

export default TcpServer;
