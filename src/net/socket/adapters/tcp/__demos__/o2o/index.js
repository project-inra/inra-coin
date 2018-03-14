// @flow

import { Socket } from "net";
import TcpServer from "../../";

const tcp1 = new TcpServer({ host: "127.0.0.1", port: 10002 });
const tcp2 = new TcpServer({ host: "127.0.0.1", port: 10003 });

tcp1.on("connection", (socket: Socket, address: string) => {
  console.log("TCP1 is connected to", address);
});

tcp2.on("connection", (socket: Socket, address: string) => {
  console.log("TCP2 is connected to", address);
});

// Creates a connection:
// 1. From TCP1 to TCP2
// 2. From TCP2 to TCP1
tcp1.connect("127.0.0.1:10003");
