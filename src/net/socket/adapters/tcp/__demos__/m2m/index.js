// @flow

import { Socket } from "net";
import TcpServer from "../../";

const tcp1 = new TcpServer({ host: "127.0.0.1", port: 10002 });
const tcp2 = new TcpServer({ host: "127.0.0.1", port: 10003 });
const tcp3 = new TcpServer({ host: "127.0.0.1", port: 10004 });

tcp1.on("connection", (socket: Socket, address: string) => {
  console.log("TCP1 is connected to", address);
});

tcp2.on("connection", (socket: Socket, address: string) => {
  console.log("TCP2 is connected to", address);
});

tcp3.on("connection", (socket: Socket, address: string) => {
  console.log("TCP3 is connected to", address);
});

// 1. From TCP1 to TCP2
// 2. From TCP2 to TCP1
tcp1.connect("127.0.0.1:10003");

// 3. From TCP1 to TCP3
// 4. From TCP3 to TCP1
tcp1.connect("127.0.0.1:10004");

// 5. From TCP2 to TCP3
// 6. From TCP3 to TCP2
tcp2.connect("127.0.0.1:10004");
