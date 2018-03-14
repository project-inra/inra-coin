import crypto from "crypto";
import Block from "./block";

/**
  * Create unique id for new block
  *
  * @return {string}
  *
*/
const createBlockId = (height: number, pervousId: string, timestamp: number, difficulty: number): string => {
  return crypto.createHmac("sha256", "temporarySecretKey")
               .update(`${height}${pervousId}${timestamp}${difficulty}`)
               .digest("hex");
}

/**
  * Create new block
  *
  * @return {Block}
*/
export const createNewBlock = (pervousBlock: Block): Block => {
  const height: number = pervousBlock.height + 1;
  const timestamp: number = new Date().getTime() / 1000;
  const difficulty: number = 0; // add difficulty calculator
  const nonce: number = 0 // add binary hash
  const data: object = {Transaction: 50}; // add transactions
  const id: string = createBlockId(height, pervousBlock.id, timestamp, difficulty);

  return new Block(height, id, pervousBlock.id, timestamp, difficulty, nonce, data);
}

/**
  * Checking block type correctness
  *
  * @return {bollean}
*/
const isBlockCorrect = (block: Block): bollean => {
  return typeof block.height === "number"
      && typeof block.id === "string"
      && typeof block.pervousId === "string"
      && typeof block.timestamp === "number"
      && typeof block.difficulty === "number"
      && typeof block.nonce === "number"
      && typeof blokc.data === "object"
}

/**
  * Checking block integrity with block chain
  *
  * @return {bollean}
*/
export const isIntegral = (newBlock: Block, pervousBlock: Block): bollean => {
  if(!isBlockCorrect){
    console.log("Invaild structure");
    return false;
  }
  else if(pervousBlock.height + 1 !== newBlock.height) {
    console.log("Invaild height");
    return false;
  }
  else if(pervousBlock.id !== newBlock.pervousId) {
    console.log("Invaild block connect id");
    return false;
  }
  else if(createBlockId(newBlock.height: number, newBlock.pervousId: string, newBlock.timestamp: number, newBlock.difficulty: number) !== newBlock.id) {
    console.log("Invaild id");
    return false
  }
  return true;
}
