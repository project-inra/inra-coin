import crypto from "crypto";
import Block from "./block";
import {hexToBinary, getTimestamp} from "./util";

/**
  * Create unique id for new block
  *
  * @return {string}
  *
*/
const createBlockId = (height: number, previousId: string, timestamp: number, difficulty: number, nonce: number, data: object): string => {
  return crypto.createHmac("sha256", "temporarySecretKey")
               .update(`${height}${previousId}${timestamp}${data}${difficulty}${nonce}`)
               .digest("hex");
}

const isRespectivelyDifficult = (id: string, difficulty: number): bollean => {
  return hexToBinary(id).startsWith("0".repeat(difficulty));
}

const findBlockId = (height: number, previousId: string, timestamp: number, data: object, difficulty: number): Block => {
  let nonce: number = 0;
  while(true) {
    const id = createBlockId(height, previousId, timestamp, data, difficulty, nonce);
    if(isRespectivelyDifficult(id, difficulty)){
      return new Block(height, id, previousId, timestamp, difficulty, nonce, data);
    }
    nonce++;
  }
}

/**
  * Create new block
  *
  * @return {Block}
*/
const createNewBlock = (previousBlock: Block, difficulty: number): Block => {
  const height: number = previousBlock.height + 1;
  const timestamp: number = getTimestamp();
  const data: object = {Transaction: 50}; // add transactions

  return findBlockId(height, previousBlock.id, timestamp, data, difficulty);
}

/**
  * Checking block type correctness
  *
  * @return {bollean}
*/
const isBlockCorrect = (block: Block): bollean => {
  return typeof block.height === "number"
      && typeof block.id === "string"
      && typeof block.previousId === "string"
      && typeof block.timestamp === "number"
      && typeof block.difficulty === "number"
      && typeof block.nonce === "number"
      && typeof blokc.data === "object"
}

const verifyBlockId = (block: block): bollean => {
  if(!createBlockId(block.height, block.id, block.previousId, block.timestamp, block.difficulty, block.nonce, block.data)) {
    console.log("Invalid id");
    return false;
  }
  else if(!isRespectivelyDifficult(block.id, block.difficulty)) {
    console.log("Bad difficulty");
    return false;
  }
  return true;
}

const isValidTimestamp = (newBlock: Block, previousBlock: Block): bollean => {
  return ( previousBlock.timestamp - 60 < newBlock.timestamp )
    && newBlock.timestamp - 60 < getTimestamp();
}

/**
  * Checking block integrity with block chain
  *
  * @return {bollean}
*/
const isIntegral = (newBlock: Block, previousBlock: Block): bollean => {
  if(!isBlockCorrect){
    console.log("Invalid structure");
    return false;
  }
  else if(previousBlock.height + 1 !== newBlock.height) {
    console.log("Invalid height");
    return false;
  }
  else if(previousBlock.id !== newBlock.previousId) {
    console.log("Invalid block connect id");
    return false;
  }
  else if(!isValidTimestamp(newBlock, previousBlock)) {
    console.log("Invalid timestamp");
    return false;
  }
  else if(!verifyBlockId(newBlock)) {
    return false;
  }
  return true;
}

export {createNewBlock, isIntegral, createBlockId};
