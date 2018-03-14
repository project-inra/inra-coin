// @flow

import { Socket } from "net";
import readline from "readline";
import TcpServer from "../../";
import createHash from "./__utils__/crypto";
import { waitForConnection } from "./__utils__/request";

const stdin = process.stdin;
const stdout = process.stdout;

const server = new TcpServer({
  port: Number(process.argv[3])
});

const rl = readline.createInterface({
  input: stdin,
  output: stdout
});

const local = {
  id: createHash(server.local),
  ip: server.local
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

      stdout.write(`${payload.ip} > ${payload.message}\n`);
    } catch (err) {
      /* … */
    }
  });

  rl.on("line", line => {
    const payload = { ...local, message: line.trim() };

    readline.moveCursor(stdout, 0, -1);
    readline.clearLine(stdout, 0);

    stdout.write(`${payload.ip} > ${payload.message}\n`);
    socket.write(JSON.stringify(payload));
  });

  rl.on("close", () => {
    // TODO remove connection from Signal Server
    process.exit(0);
  });
});
