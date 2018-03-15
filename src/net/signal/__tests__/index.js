import SignalServer from "../";
const chai = require("chai");
const http = require("chai-http");
const should = chai.should();

chai.use(http);

const signal = new SignalServer();
const request = chai.request;

describe("Signal Server", function () {
  describe("#open()", function () {
    it("should start listetning", function (done) {
      signal.open(function () {
        done();
      });
    });
  });

  describe("POST /peers", function () {
    it("should add a new peer", function (done) {
      Promise.all([
        request(signal.server).post("/peers").query({ hash: "1", port: 10000 }),
        request(signal.server).post("/peers").query({ hash: "2", port: 10001 }),
        request(signal.server).post("/peers").query({ hash: "3", port: 10002 })
      ]).then(responses => {
        for (const response in responses) {
          response.should.be.an("object");
          response.body.should.be.an("object");
          response.body.success.should.equal(true);
        }

        done();
      }).catch(error => {
        done(false);
      });
    });

    it("should throw an error if invalid hash", function (done) {
      // Not a valid hex
      request(signal.server).post("/peers").query({hash: "xyz"}).then(res => {
        // Should fail
        done(new Error());
      }).catch(err => {
        const res = err.response;

        res.should.be.an("object");
        res.body.should.be.an("object");
        res.body.success.should.equal(false);
        res.body.message.should.be.a("string");

        done();
      });
    });

    it("should throw an error if invalid port", function (done) {
      // Not a valid port
      request(signal.server).post("/peers").query({port: "xyz"}).then(res => {
        // Should fail
        done(new Error());
      }).catch(err => {
        const res = err.response;

        res.should.be.an("object");
        res.body.should.be.an("object");
        res.body.success.should.equal(false);
        res.body.message.should.be.a("string");

        done();
      });
    });
  });

  describe("DELETE /peers", function () {
    it("should remove an existing peer", function (done) {
      request(signal.server).delete("/peers").query({hash: "3"}).then(res => {
        res.should.be.an("object");
        res.body.should.be.an("object");
        res.body.success.should.equal(true);
        res.body.deleted.should.equal(true);

        done();
      }).catch(error => {
        done(new Error());
      });
    });

    it("should throw an error if peer doesn't exist", function (done) {
      request(signal.server).delete("/peers").query({hash: "-1"}).then(res => {
        // Should fail
        done(new Error());
      }).catch(err => {
        const res = err.response;

        res.should.be.an("object");
        res.body.should.be.an("object");
        res.body.success.should.equal(false);
        res.body.message.should.be.a("string");
        res.body.message.should.equal("Could not find peer with id -1");

        done();
      });
    });
  });

  describe("GET /peers", function () {
    it("should return all peers", function (done) {
      request(signal.server).get("/peers").then(response => {
        response.should.be.an("object");
        response.body.should.be.an("object");
        response.body.success.should.equal(true);
        response.body.results.should.be.an("array");

        done();
      }).catch(error => {
        done(new Error());
      });
    });

    it("should return requested peer", function (done) {
      request(signal.server).get("/peers").query({hash: "2"}).then(res => {
        res.should.be.an("object");
        res.body.should.be.an("object");
        res.body.success.should.equal(true);
        res.body.result.should.be.a("string");

        done();
      }).catch(error => {
        done(new Error());
      });
    });

    it("should throw an error if peer doesn't exist", function (done) {
      request(signal.server).get("/peers").query({hash: "-1"}).then(res => {
        // Should fail
        done(new Error());
      }).catch(err => {
        const res = err.response;

        res.should.be.an("object");
        res.body.should.be.an("object");
        res.body.success.should.equal(false);
        res.body.message.should.be.a("string");
        res.body.message.should.equal("Could not find peer with id -1");

        done();
      });
    });
  });

  describe("#close()", function () {
    it("should stop listetning", function (done) {
      signal.close(function () {
        done();
      });
    });
  });
});
