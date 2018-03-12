import url from "url";
import joi from "joi";
import qss from "querystring";
import http, { Server, ClientRequest, ServerResponse } from "http";

// prettier-ignore
export const SignalSchema = joi.object().length(2).keys({
  id: joi.string().hex().required().description("Peer IP"),
  data: joi.string().ip().required().description("Peer ID")
});

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
 *   peer he’d like to connect.
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
  peers: SignalPeers = new Map();

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
   * @param   {ClientRequest}   request   HTTP request
   * @param   {ServerResponse}  response  HTTP response
   * @return  {void}
   */
  createServer(request: ClientRequest, response: ServerResponse): void {
    const route = url.parse(request.url).pathname.split("?")[0];
    const query = qss.parse(request.url.split("?")[1]);

    // Adding a peer to the list:
    if (request.method === "POST" && route === "/join") {
      this.addPeer(query.id, query.ip)
        .then(data => {
          response.statusCode = 200;
          response.setHeader("Content-Type", "application/json");
          response.end(
            JSON.stringify({
              success: true,
              result: data
            })
          );
        })
        .catch(err => {
          response.statusCode = 400;
          response.setHeader("Content-Type", "application/json");
          response.end(
            JSON.stringify({
              success: false,
              message: err.message
            })
          );
        });
    }

    // Returning a peer from the list:
    if (request.method === "GET" && route === "/join") {
      if (query.id) {
        this.getPeer(query.id)
          .then(data => {
            response.statusCode = 200;
            response.setHeader("Content-Type", "application/json");
            response.end(
              JSON.stringify({
                success: true,
                result: data
              })
            );
          })
          .catch(err => {
            response.statusCode = 400;
            response.setHeader("Content-Type", "application/json");
            response.end(
              JSON.stringify({
                success: false,
                message: err.message
              })
            );
          });
      } else {
        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json");
        response.end(
          JSON.stringify({
            success: true,
            results: this.getPeers()
          })
        );
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
  addPeer(id: SignalPeerHash, data: SignalPeerData): Promise<Object> {
    return new Promise((resolve, reject) => {
      joi.validate({ id, data }, SignalSchema, (err, value) => {
        if (err) {
          reject(err);
        } else {
          this.peers.set(id, data);

          resolve(value);
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
  getPeer(id: SignalPeerHash): Promise<SignalPeerData> {
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
}
