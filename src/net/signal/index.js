import url from "url";
import http, { Server, ClientRequest, ServerResponse } from "http";
import qss from "querystring";

export type SignalConfig = { port: number };
export type SignalPeerHash = string;
export type SignalPeerData = string;
export type SignalPeers = { [SignalPeerHash]: SignalPeerData };

/**
 * As from StackOverflow:
 * WebRTC knows how to talk directly to another peer without a signaling server,
 * but it doesn't know how to discover another peer. Discovery is an inherent
 * problem ~ https://stackoverflow.com/questions/29032884
 *
 * This class provides a simple signal server that gives a peer the initial data
 * required to connect into the network. Basically – before a peer will join our
 * network:
 * • he must make a POST request to this server, passing in a random hash (which
 *   will serve as his identifier) and his IP address.
 * • he must make a second GET request which searches the server for a specific
 *   peer he’d like to connect to or a random one.
 *
 * Then, his client app can establish a peer-to-peer connection between him and
 * the returned peer.
 *
 * @namespace   signal
 * @memberof    net
 * @class
 */
export default class Signal {
  server: Server;
  config: SignalConfig;
  peers: SignalPeers = {};

  constructor(config: SignalConfig = { port: 8000 }) {
    this.config = config;
    this.server = http.createServer(this.create.bind(this));
  }

  /**
   * Creates a basic signal server.
   *
   * @todo    Pheraps we should check if the user is already in the peer list
   *          before he can actually request another peer IP.
   *
   * @api {post}  /join                   Joins the network
   * @api {get}   /join                   Grabs a peer from the network
   * @apiName     SignalJoin
   * @apiGroup    Signal
   * @apiParam    {string}  id            Peer ID
   * @apiParam    {string}  ip            Peer IP
   *
   * @param   {ClientRequest}   request   HTTP request
   * @param   {ServerResponse}  response  HTTP response
   * @return  {void}
   */
  create(request: ClientRequest, response: ServerResponse): void {
    const route = url.parse(request.url).pathname.split("?")[0];
    const query = qss.parse(request.url.split("?")[1]);

    // Adding a peer to the list:
    if (request.method === "POST" && route === "/join") {
      if (query.id && query.ip) {
        this.peers[query.id] = String(query.ip);

        response.end("Success");
      } else {
        response.end("Failed");
      }
    }

    // Returning a peer from the list:
    if (request.method === "GET" && route === "/join") {
      const peerId = query.id || this.getRandomPeerID();

      if (peerId) {
        response.end(JSON.stringify(this.peers[peerId]));
      } else {
        response.end("Failed");
      }
    }
  }

  /**
   * Starts the HTTP server listening for connections.
   *
   * @return  {void}
   */
  open(): void {
    this.server.listen(this.config.port);
  }

  /**
   * Stops the server from accepting new connections.
   *
   * @param   {Function}    callback      Optional callback
   * @return  {void}
   */
  close(callback?: Function): void {
    if (this.server.listening) {
      this.server.close(callback);
    }
  }

  /**
   * Returns a random peer ID from the list.
   *
   * @return  {SignalPeerHash}            Random peer id from the list
   */
  getRandomPeerID(): SignalPeerHash {
    const hashes = Object.keys(this.peers);

    return hashes[(hashes.length * Math.random()) << 0];
  }
}
