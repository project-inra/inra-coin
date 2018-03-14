// @flow
import SignalServer from "../";

const server = new SignalServer({
  port: 8000
});

// Starts listening:
server.open();
