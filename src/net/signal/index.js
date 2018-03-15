// @flow
import url from "url";
import net from "net";
import joi from "joi";
import qss from "querystring";
import { getClientIp } from "request-ip";
import http, { Server, IncomingMessage, ServerResponse } from "http";

// @see   http://www.bittorrent.org/beps/bep_0003.html#trackers
// prettier-ignore
export const SignalSchema: Object = joi.object().max(3).keys({
  hash: joi.string().hex().required().description("Peer ID"),
  port: joi.number().required().description("Peer Port"),
  ip: joi.string().ip().description("Peer IP"),
});

export type SignalPeerHash = string;
export type SignalPeerPort = number;
export type SignalPeerIP = string;
export type SignalConfig = { port: number };
export type SignalPayload = {
  hash: SignalPeerHash,
  port: SignalPeerPort,
  ip: SignalPeerIP
};

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
 * @requires    request-ip
 * @requires    joi
 * @class
 */
export default class Signal {
  server: Server;
  config: SignalConfig;
  peers: Map<SignalPeerHash, SignalPeerIP> = new Map();

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
   * @api {post}    /peers                  Adds a peer to the list
   * @apiName       SignalJoin
   * @apiGroup      Signal
   * @apiParam      {string}  hash          Peer ID
   * @apiParam      {number}  port          Peer port
   * @apiParam      {string}  ip            Peer IP (optional)
   *
   * @api {get}     /peers                  Returns peers from the list
   * @apiName       SignalJoin
   * @apiGroup      Signal
   * @apiParam      {string?} hash          Peer ID (optional)
   *
   * @api {delete}  /peers                  Removes a peer from the list
   * @apiName       SignalJoin
   * @apiGroup      Signal
   * @apiParam      {string}  hash          Peer ID
   *
   * @param   {IncomingMessage} request   HTTP request
   * @param   {ServerResponse}  response  HTTP response
   * @return  {void}
   */
  createServer(request: IncomingMessage, response: ServerResponse): void {
    const route = String(url.parse(request.url).pathname).split("?")[0];
    const payload: SignalPayload = qss.parse(request.url.split("?")[1]);

    // IPv4 or IPv6
    payload.ip = getClientIp(request) || payload.ip;

    // Helpers:
    const success = Signal.handleSuccess;
    const error = Signal.handleError;

    // Adding a peer to the list:
    if (request.method === "POST" && route === "/peers") {
      this.addPeer(payload)
        .then(data => success(response, { result: data }))
        .catch((err: Error) => error(response, { message: err.message }));
    }

    // Returning peers from the list:
    if (request.method === "GET" && route === "/peers") {
      if (payload.hash) {
        this.getPeer(payload.hash)
          .then(data => success(response, { result: data }))
          .catch((err: Error) => error(response, { message: err.message }));
      } else {
        success(response, { results: this.getPeers() });
      }
    }

    // Deleting a peer from the list:
    if (request.method === "DELETE" && route === "/peers") {
      if (payload.hash) {
        this.removePeer(payload.hash)
          .then(data => success(response, { deleted: data }))
          .catch((err: Error) => error(response, { message: err.message }));
      } else {
        error(response, { message: "No peer ID provided" });
      }
    }
  }

  /**
   * Adds a peer to the list if provided data is correct. Rejects the promise if
   * an error occured during the validation process.
   *
   * @param   {SignalPayload}   payload
   * @return  {Promise<Object>}
   */
  addPeer(payload: SignalPayload): Promise<Object> {
    return new Promise((resolve, reject) => {
      joi.validate(payload, SignalSchema, (err: Error) => {
        if (err) {
          reject(err);
        } else {
          if (net.isIPv6(payload.ip)) {
            this.peers.set(payload.hash, `[${payload.ip}]:${payload.port}`);
          } else {
            this.peers.set(payload.hash, `${payload.ip}:${payload.port}`);
          }

          resolve(payload);
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
  getPeer(id: SignalPeerHash): Promise<SignalPeerIP | void> {
    return new Promise((resolve, reject) => {
      if (this.peers.has(id)) {
        resolve(this.peers.get(id));
      } else {
        reject(new Error(`Could not find peer with id ${id}`));
      }
    });
  }

  /**
   * Removes a peer from the list. Throws an error if the peer can't be found.
   *
   * @param   {SignalPeerHash}  id
   * @return  {Promise<SignalPeerData>}
   */
  removePeer(id: SignalPeerHash): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.peers.has(id)) {
        resolve(this.peers.delete(id));
      } else {
        reject(new Error(`Could not find peer with id ${id}`));
      }
    });
  }

  /**
   * Returns each connected peer id.
   *
   * @return  {Array<SignalPeerIP>}
   */
  getPeers(): Array<SignalPeerIP> {
    return Array.from(this.peers.values());
  }

  /**
   * Starts the HTTP server listening for connections.
   *
   * @param   {Function}    callback        Optional callback
   * @return  {void}
   */
  open(callback?: Function): void {
    if (!this.server.listening) {
      this.server.listen(this.config.port, callback);
    }
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
