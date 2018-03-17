// @flow
import net, { Server, Socket } from "net";
import lpm from "length-prefixed-message";
import EventEmitter from "events";
import networkAddress from "network-address";
import { parseAddress } from "../../../utils/addrUtils";
import { ServerInterface } from "../AdapterInterface";
import type { PeerAddress } from "../AdapterInterface";
import TcpSocket from "./Socket";

// Debugging:
const debug = require("debug")("p2p-tcp");

// TCK standard packet flags:
const SYN = "SYN";
const SYN_ACK = "SYN_ACK";
const ACK = "ACK";
type FLAG = "SYN" | "SYN_ACK" | "ACK";

type Config = {
  port: number,
  host?: string,
  handshake?: number
};

/**
 * TCP Server provides an asynchronous network API for creating stream based TCP
 * (or IPC) servers. It handles the standard 3-Way Handshake Diagram:
 *  1.a. Host A sends a SYNchronize packet to Host B;
 *  1.b. Host B receives A's SYN;
 *  2.a. Host B sends a SYNchronize-ACKnowledgement;
 *  2.b. Host A receives B's SYN-ACK;
 *  3.a. Host A sends ACKnowledge;
 *  3.b. Host B receives ACK;
 *
 * Then, the TCP socket connection is ESTABLISHED. This server allows you to
 * create a network with a fully connected topology (P2MP).
 *
 * @example Basic usage
 *    const tcp1 = new TcpServer({ port: 10002, host: "127.0.0.1" });
 *    const tcp2 = new TcpServer({ port: 10003 });
 *    const tcp3 = new TcpServer({ port: 10004 });
 *
 *    tcp1.on("connection", (peer, ip) => console.log("TCP1 connected to", ip));
 *    tcp2.on("connection", (peer, ip) => console.log("TCP2 connected to", ip));
 *    tcp3.on("connection", (peer, ip) => console.log("TCP3 connected to", ip));
 *
 *    tcp1.connect("127.0.0.1:10003");
 *    tcp2.connect("127.0.0.1:10002");
 *    tcp2.connect("127.0.0.1:10004");
 *
 * If you run the above example it should print that everyone is connected to
 * everyone. If a connection is destroyed the topology will try to reconnect it.
 *
 * @namespace   tcp
 * @memberof    socket.adapters
 * @extends     EventEmitter
 * @requires    debug
 * @requires    network-address
 * @requires    length-prefixed-message
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
    this.server = net.createServer(this.handlePing.bind(this));
    this.server.listen(this.config.port);

    debug("Created a new TCP server", this.local);
  }

  /**
   * Adds a peer to the topology and tries to establish a new TCP connection.
   *
   * @param   {PeerAddress}   address
   * @return  {void}
   */
  connect(address: PeerAddress): void {
    if (address === this.local)
      throw new Error("Cannot connect to local machine");

    if (this.peers.has(address))
      throw new Error(`Already connected to ${address}`);

    try {
      const addr = parseAddress(address);
      const peer = this.addPeer(address);

      peer.setHost(addr.host);
      peer.setPort(addr.port);

      this.ping(SYN, peer);
    } catch (error) {
      throw new Error(`Unsupported address provided ${address}`);
    }
  }

  /**
   * Removes a peer from the created topology and closes the connection.
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

    // $FlowFixMe: `.get` returns a valid TcpSocket (check above)
    this.peers.get(address).disconnect();
    this.peers.delete(address);
  }

  /**
   * Closes the server and disconnects each connected peer.
   *
   * @return  {void}
   */
  destroy(): void {
    if (this.server.listening) {
      this.server.close();
    }

    // Disconnect each peer:
    this.peers.forEach((socket, peer) => this.disconnect(peer));
  }

  /**
   * Returns a TCP Socket for a given address. Creates a new one, if it is not
   * already in the server's list.
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
   * Handles each incomming ping. The term pings refers here to one of three
   * connection states:
   * – SYN (request SYNchronize);
   * – SYN_ACK (acknowledge request);
   * – ACK (connection established);
   *
   * @param   {Socket}  socket
   * @return  {void}
   * @access  private
   */
  handlePing(socket: Socket): void {
    this.handleError(socket);

    lpm.read(socket, (address: Buffer) => {
      // Address format: IP:PORT#FLAG, ex.: 127.0.0.1:8000#ACK
      const data: Array<any> = address.toString().split("#");
      const from: PeerAddress = data[0]; // Remote IP adress
      const flag: FLAG = data[1]; // Constant flag
      const peer = this.addPeer(from);

      // ">" means "received"
      debug(">", this.local, `(${flag})`);

      switch (flag) {
        // Received order to synchronize from remote host (SYN):
        case SYN:
          peer.setPendingSocket(socket);
          peer.setReconnectTimeout(null);
          this.ping(SYN_ACK, peer);
          return;

        // Remote host received order to synchronize (SYN_ACK):
        case SYN_ACK:
          peer.setPendingSocket(socket);
          peer.setReconnectTimeout(null);
          this.ping(ACK, peer);
          return;

        // Remote host knows we've established a connection (ACL):
        case ACK:
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
  ping(flag: FLAG, peer: TcpSocket): void {
    // "<" means "sending"
    debug("<", this.local, `(${flag})`);

    if (flag === SYN) {
      peer.connect();
    }

    switch (flag) {
      case SYN:
      case SYN_ACK:
        // Inform the remote host about sync acknowledgement:
        lpm.write(peer.pendingSocket, `${this.local}#${flag}`);

        // $FlowFixMe Wait for remote host's response:
        this.handlePing(peer.pendingSocket);
        return;

      case ACK:
        // Inform the remote host about acknowledgement:
        lpm.write(peer.pendingSocket, `${this.local}#${ACK}`);

        // $FlowFixMe Connection finally established:
        this.handleReady(peer, peer.pendingSocket);
    }
  }

  /**
   * This method is called once a connection has been successfully established.
   *
   * @param   {TcpSocket}   peer
   * @param   {Socket}      socket
   * @return  {void}
   * @access  private
   */
  handleReady(peer: TcpSocket, socket: Socket): void {
    // Reset timeout:
    socket.setTimeout(0);

    peer.setReconnectRetries(0);
    peer.setSocket(socket);
    peer.setPendingSocket(null);

    this.handleError(socket);
    this.handleReconnect(peer, socket);

    this.emit("connection", peer.socket, peer.id);
  }

  /**
   * Basic error handling.
   *
   * @param   {Socket}      socket
   * @return  {void}
   * @access  private
   */
  handleError(socket: Socket): void {
    // Set the socket to timeout after timeout milliseconds of inactivity on the
    // socket. If handshake is 0, then the existing idle timeout is disabled.
    socket.setTimeout(this.config.handshake || 0, () => {
      debug("Disconnected: Timeout");
      socket.destroy();
    });

    socket.on("error", (err: Error) => {
      debug("Could not connect:", err.message);
      socket.destroy();
    });
  }

  /**
   * Basic connection recovery system.
   *
   * @param   {TcpSocket}   peer
   * @param   {Socket}      socket
   * @return  {void}
   */
  handleReconnect(peer: TcpSocket, socket: Socket): void {
    socket.on("close", () => {
      // Remove the peer from the list:
      this.peers.delete(peer.id);

      // Connection closes on purpose (connection was already established):
      if (peer.isClosed) return;

      const reconnect = () => this.ping(SYN, peer);
      peer.setReconnectRetries(peer.reconnectRetries + 1);
      peer.setReconnectTimeout(reconnect);

      this.emit("reconnect", peer.id, peer.reconnectRetries);
    });
  }

  get connections(): Array<TcpSocket> {
    return Array.from(this.peers.values());
  }
}

export default TcpServer;
