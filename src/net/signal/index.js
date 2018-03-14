// @flow
import url from "url";
import joi from "joi";
import qss from "querystring";
import http, { Server, IncomingMessage, ServerResponse } from "http";

// prettier-ignore
export const SignalSchema: Object = joi.object().length(2).keys({
  hash: joi.string().hex().required().description("Peer ID"),
  // .ip() doesn't accept local addresses?
  data: joi.string()/* .ip() */.required().description("Peer IP")
});

export type SignalConfig = { port: number };
export type SignalPeerHash = string;
export type SignalPeerData = string;

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
 *   peer he’d like to connect.
 *
 * Then, his client app can establish a peer-to-peer connection between him and
 * the returned peer.
 *
 * @namespace   signal
 * @memberof    net
 * @requires    joi
 * @class
 */
export default class Signal {
  server: Server;
  config: SignalConfig;
  peers: Map<SignalPeerHash, SignalPeerData> = new Map();

  constructor(config: SignalConfig = { port: 8000 }) {
    this.config = config;
    this.server = http.createServer(this.createServer.bind(this));
  }

  /**
   * Creates a basic signal server.
   *
   * @todo    Pheraps we should check if the user is already in the peer list
   *          before he can actually request another peer IP.
   *
   * @api {post}  /join                   Joins the network
   * @apiName     SignalJoin
   * @apiGroup    Signal
   * @apiParam    {string}  id            Peer ID
   * @apiParam    {string}  ip            Peer IP
   *
   * @api {get}   /join                   Grabs a peer from the network
   * @apiName     SignalJoin
   * @apiGroup    Signal
   * @apiParam    {string?} id            Peer ID (optional)
   *
   * @param   {IncomingMessage} request   HTTP request
   * @param   {ServerResponse}  response  HTTP response
   * @return  {void}
   */
  createServer(request: IncomingMessage, response: ServerResponse): void {
    const route = String(url.parse(request.url).pathname).split("?")[0];
    const query: {
      id: SignalPeerHash,
      ip: SignalPeerData
    } = qss.parse(request.url.split("?")[1]);

    // Helpers:
    const success = Signal.handleSuccess;
    const error = Signal.handleError;

    // Adding a peer to the list:
    if (request.method === "POST" && route === "/join") {
      this.addPeer(query.id, query.ip)
        .then(data => success(response, { result: data }))
        .catch((err: Error) => error(response, { message: err.message }));
    }

    // Returning peers from the list:
    if (request.method === "GET" && route === "/join") {
      if (query.id) {
        this.getPeer(query.id)
          .then(data => success(response, { result: data }))
          .catch((err: Error) => error(response, { message: err.message }));
      } else {
        success(response, { results: this.getPeers() });
      }
    }
  }

  /**
   * Adds a peer to the list if provided data is correct. Rejects the promise if
   * an error occured during the validation process.
   *
   * @param   {SignalPeerHash}  id
   * @param   {SignalPeerData}  data
   * @return  {Promise<Object>}
   */
  addPeer(hash: SignalPeerHash, data: SignalPeerData): Promise<Object> {
    return new Promise((resolve, reject) => {
      joi.validate({ hash, data }, SignalSchema, (err: Error) => {
        if (err) {
          reject(err);
        } else {
          this.peers.set(hash, data);

          resolve({ hash, data });
        }
      });
    });
  }

  /**
   * Returns a peer with a given id. Throws an error if the peer can't be found.
   *
   * @param   {SignalPeerHash}  id
   * @return  {Promise<SignalPeerData>}
   */
  getPeer(id: SignalPeerHash): Promise<SignalPeerData | void> {
    return new Promise((resolve, reject) => {
      if (this.peers.has(id)) {
        resolve(this.peers.get(id));
      } else {
        reject(new Error(`Could not find peer with id ${id}`));
      }
    });
  }

  /**
   * Returns each connected peer id.
   *
   * @return  {Array<SignalPeerData>}
   */
  getPeers(): Array<SignalPeerData> {
    return Array.from(this.peers.values());
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

  static handleSuccess(response: ServerResponse, data: Object) {
    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        success: true,
        ...data
      })
    );
  }

  static handleError(response: ServerResponse, data: Object) {
    response.statusCode = 400;
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        success: false,
        ...data
      })
    );
  }
}
