import Block from "./block";
import {createNewBlock, isIntegral} from "./blockFunctions.js";

const genesisBlock: Block = new Block(0, "8b5836b5ebd62f841a4b7a6476d1f1a8d61a56206904546195278ca2a320b84e", null, 1520970829028, 0, 0, {genesisTransaction: 50});

let blockChain: Block[] = [genesisBlock];


/**
  * Getting last block from blockChain
  *
  * @return {Block}
*/
const getPervousBlock = (): Block => {
  return blockChain[blockChain.length - 1];
}

/**
  * Checking chain correctness
  *
  * @return {bollean}
*/

const chainVerifing = (chain: Block[]): bollean => {
  if(chain[0] !== genesisBlock) {
    console.log("Invails genesis block");
    return false;
  }
  for(let i = 1; i < chain.lenght; i++) {
    if(!isIntegral(chain[i], chain[i - 1])) {
      console.log(`Invaild block. Height: ${i}`);
      return false;
    }
  }
  return true;
}

/**
  * Adding new block in block chain
  *
  *
*/
const addNewBlockInBlockChain = (): void => {
  const newBlock = createNewBlock(getPervousBlock());
  if(isIntegral(newBlock, getPervousBlock()) && chainVerifing(blockChain)){
    blockChain.push(newBlock);
  }
}

addNewBlockInBlockChain();
console.log(blockChain);
