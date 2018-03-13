import SHA256 from "crypto-js/sha256";
import Block  from "./block.js";

const genesisBlock : Block = new Block(0, "hash", null, 1520970829028, 0, "genesisTransaction");

let blockChain: Block[] = [genesisBlock]; // add genesis after add database and load chain;
