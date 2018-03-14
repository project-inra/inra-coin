// @flow

import { Socket } from "net";
import TcpServer from "../";

const tcp1 = new TcpServer({ port: 10002, host: "127.0.0.1" });
const tcp2 = new TcpServer({ port: 10003 });
const tcp3 = new TcpServer({ port: 10004 });

tcp1.on("connection", (socket: Socket, address: string) => {
  console.log("TCP1 is connected to", address);
});

tcp2.on("connection", (socket: Socket, address: string) => {
  console.log("TCP2 is connected to", address);
});

tcp3.on("connection", (socket: Socket, address: string) => {
  console.log("TCP3 is connected to", address);
});

tcp1.connect("127.0.0.1:10003");
tcp2.connect("127.0.0.1:10002");
tcp2.connect("127.0.0.1:10004");
