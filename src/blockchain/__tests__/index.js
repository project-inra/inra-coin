import Chain from "../Chain";
import Block from "../Block";
import type BlockPayload from "../Block";

const chai = require("chai");
const should = chai.should();
const expect = chai.expect;

let chain = null;
let payload: BlockPayload = {
  index: 0,
  hash: "",
  previousHash: null,
  timestamp: 1521077085,
  difficulty: 8,
  nonce: 8,
  data: { genesisTransaction: 50 }
};

let newBlock = null;
let fakeBlock = new Block({...payload, hash: "some_fake_hash"});
let genesisBlock = null;

describe("Blockchain", function () {
  describe("Block", function () {
    describe("#generateID()", function () {
      it("should generate SHA256 hash", function () {
        payload.hash = Block.generateID(payload);
        payload.should.have.property("hash").with.lengthOf(64);
      });
    });

    describe("#constructor()", function () {
      it("should create a genesis block", function () {
        genesisBlock = new Block(payload);

        genesisBlock.should.have.property("index").equal(0);
        genesisBlock.should.have.property("hash").with.lengthOf(64);
        genesisBlock.should.have.property("previousHash");
        genesisBlock.should.have.property("timestamp").equal(1521077085);
        genesisBlock.should.have.property("difficulty").equal(8);
        genesisBlock.should.have.property("nonce").equal(8);
        genesisBlock.should.have.property("data");
      });
    });

    describe("#verifyID", function () {
      it("should verify SHA256 hash", function () {
        Block.verifyID(genesisBlock).should.be.equal(true);
        Block.verifyID(fakeBlock).should.be.equal(false);
      });
    });
  });

  describe("Chain", function () {
    describe("#constructor()", function () {
      it("should create a chain with genesis block", function () {
        chain = new Chain(genesisBlock);

        chain.should.have.property("blocks").with.lengthOf(1);
        chain.length.should.be.equal(1);
        chain.last.should.be.equal(genesisBlock);
        chain.genesis.should.be.equal(genesisBlock);
      });
    });

    describe("#generateBlock()", function () {
      it("should create a block for a given difficulty", function () {
        newBlock = chain.generateBlock(1);

        newBlock.should.have.property("index").equal(1);
        newBlock.should.have.property("hash").with.lengthOf(64);
        newBlock.should.have.property("previousHash").equal(genesisBlock.hash);
        newBlock.should.have.property("timestamp")
        newBlock.should.have.property("difficulty").equal(1);
        newBlock.should.have.property("nonce")
        newBlock.should.have.property("data");
      });
    });

    describe("#isValid()", function () {
      it("should validate when blocks are both valid", function () {
        chain.isValid(newBlock, genesisBlock).should.equal(true);
      });

      it("should throw an error when blocks are not valid", function () {
        expect(function () {
          chain.isValid(fakeBlock, genesisBlock);
        }).to.throw(Error);
      });
    });

    describe("#push()", function () {
      it("should push a new block to the chain", function () {
        chain.push(newBlock);

        chain.length.should.be.equal(2);
        chain.last.should.be.equal(newBlock);
        chain.genesis.should.be.equal(genesisBlock);
      });

      it("should throw an error if index is corrupted", function () {
        newBlock = chain.generateBlock(1);
        newBlock.index = 0;

        expect(function () {
          chain.push(newBlock);
        }).to.throw(Error);
      });

      it("should throw an error if hash is corrupted", function () {
        newBlock = chain.generateBlock(1);
        newBlock.hash = "";

        expect(function () {
          chain.push(newBlock);
        }).to.throw(Error);
      });

      it("should throw an error if previousHash is corrupted", function () {
        newBlock = chain.generateBlock(1);
        newBlock.previousHash = "";

        expect(function () {
          chain.push(newBlock);
        }).to.throw(Error);
      });

      it("should throw an error if difficulty is corrupted", function () {
        newBlock = chain.generateBlock(1);
        newBlock.difficulty = 999;

        expect(function () {
          chain.push(newBlock);
        }).to.throw(Error);
      });

      it("should throw an error if timestamp is corrupted", function () {
        newBlock = chain.generateBlock(1);
        newBlock.timestamp = +new Date() + 70;

        expect(function () {
          chain.push(newBlock);
        }).to.throw(Error);

        newBlock = chain.generateBlock(1);
        newBlock.timestamp = +new Date() - 70;

        expect(function () {
          chain.push(newBlock);
        }).to.throw(Error);
      });
    });

    describe("#isCorrupted()", function () {
      it("should validate when all blocks", function () {
        chain.isCorrupted().should.equal(false);
      });

      it("should throw an error when a block is not valid", function () {
        chain.blocks.push(fakeBlock);

        expect(function () {
          chain.isCorrupted();
        }).to.throw(Error);
      });
    });
  });
});
