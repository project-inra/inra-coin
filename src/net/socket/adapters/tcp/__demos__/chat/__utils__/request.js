// @flow
import http from "http";
import qss from "querystring";

type Verb = "POST" | "GET";

export function request(
  method: Verb,
  address: string,
  query?: Object = {}
): Promise<Object> {
  return new Promise((resolve, reject) => {
    const path = `/join?${qss.stringify(query)}`;
    const host = address.split(":")[0];
    const port = address.split(":")[1];

    const req = http.request({ host, port, path, method }, res => {
      let response = "";

      res.setEncoding("utf8");

      res.on("data", function(chunk: string) {
        response += chunk;
      });

      res.on("end", () => {
        resolve(JSON.parse(response));
      });
    });

    req.on("error", (err: Error) => {
      reject(err.message);
    });

    req.end();
  });
}

export function get(host: string, query?: Object): Promise<Object> {
  return request("GET", host, query);
}

export function post(host: string, query?: Object): Promise<Object> {
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
