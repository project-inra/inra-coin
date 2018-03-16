// @flow
import http from "http";
import qss from "querystring";

type Verb = "POST" | "GET" | "DELETE";

function request(
  method: Verb,
  address: string,
  query?: Object = {}
): Promise<Object> {
  return new Promise((resolve, reject) => {
    const path = `/peers?${qss.stringify(query)}`;
    const addr = address.split(":");
    const host = addr[0];
    const port = addr[1];

    const req = http.request({ host, port, path, method }, res => {
      let response = "";

      res.setEncoding("utf8");
      res.on("data", (chunk: string) => { response += chunk; });
      res.on("end", () => { resolve(JSON.parse(response)); });
    });

    req.on("error", (err: Error) => {
      reject(err.message);
    });

    req.end();
  });
}

function get(host: string, query?: Object): Promise<Object> {
  return request("GET", host, query);
}

function del(host: string, query?: Object): Promise<Object> {
  return request("DELETE", host, query);
}

function post(host: string, query?: Object): Promise<Object> {
  return request("POST", host, query);
}

export function waitForConnection(
  host: string,
  query: Object,
  callback: string => any
) {
  get(host).then((peers: { success: boolean, results: Array<string> }) => {
    if (peers.results.length) {
      callback(peers.results[0]);
    } else {
      post(host, query);

      console.log("Waiting for connections");
    }
  });
}

export function removeConnection(host: string,  query: Object) {
  del(host, query);
}
