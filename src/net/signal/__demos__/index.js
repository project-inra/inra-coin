// @flow
import SignalServer from "../";

const server = new SignalServer({
  port: 2250
});

// Starts listening:
server.open();
