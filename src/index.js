// @flow

import Signal from "./net/signal/index";

const server = new Signal({
  port: 8080
});

server.open();
