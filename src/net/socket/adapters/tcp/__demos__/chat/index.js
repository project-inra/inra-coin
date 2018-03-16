// @flow

import { Socket } from "net";
import readline from "readline";
import TcpServer from "../../";
import createHash from "./__utils__/crypto";
import { waitForConnection, removeConnection } from "./__utils__/signal";

const port = Number(process.argv[3]);
const input = process.stdin;
const output = process.stdout;

const server = new TcpServer({ port });
const rl = readline.createInterface({ input, output });

const local = {
  hash: createHash(server.local),
  port: Number(process.argv[3])
};

waitForConnection(process.argv[2], local, (peer: string) => {
  server.connect(peer);
});

server.on("connection", (socket: Socket, address: string) => {
  console.log("TCP is connected to", address);

  socket.setEncoding("utf8");
  socket.on("data", chunk => {
    try {
      const payload = JSON.parse(chunk.toString("utf8"));

      output.write(`${payload.port} > ${payload.message}\n`);
    } catch (err) {
      /* … */
    }
  });

  rl.on("line", line => {
    const payload = { ...local, message: line.trim() };

    readline.moveCursor(output, 0, -1);
    readline.clearLine(output, 0);

    output.write(`${payload.port} > ${payload.message}\n`);
    socket.write(JSON.stringify(payload));
  });

  rl.on("close", () => {
    removeConnection(process.argv[2], local);
  });
});
