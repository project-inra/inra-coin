import TcpServer from "../";
const chai = require("chai");
const should = chai.should();

describe("TCP Adapter", function () {
  describe("2 peers", function () {
    it("should connect to each other", function (done) {
      let connections = 2;
      const tcp1 = new TcpServer({ host: "127.0.0.1", port: 10002 });
      const tcp2 = new TcpServer({ host: "127.0.0.1", port: 10003 });

      function end() {
        tcp1.destroy();
        tcp2.destroy();

        done();
      }

      tcp1.on("connection", (socket, address) => {
        address.should.equal("127.0.0.1:10003");
        if (--connections === 0) end();
      });

      tcp2.on("connection", (socket, address) => {
        address.should.equal("127.0.0.1:10002");
        if (--connections === 0) end();
      });

      tcp1.connect("127.0.0.1:10003");
    });

    it("should reconnect on connection loss", function (done) {
      const tcp1 = new TcpServer({ host: "127.0.0.1", port: 10002 });
      const tcp2 = new TcpServer({ host: "127.0.0.1", port: 10003 });

      tcp1.on("connection", (socket, address) => {
        address.should.equal("127.0.0.1:10003");
        socket.destroy();
      });

      tcp2.on("reconnect", (address, retries) => {
        address.should.equal("127.0.0.1:10002");

        tcp1.destroy();
        tcp2.destroy();

        done();
      });

      tcp1.connect("127.0.0.1:10003");
    });
  });
});
