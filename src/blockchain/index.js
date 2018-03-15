import Block from "./block";
import {createNewBlock, isIntegral} from "./createBlock";

const genesisBlock: Block = new Block(0, "8b5836b5ebd62f841a4b7a6476d1f1a8d61a56206904546195278ca2a320b84e", null, 1521077085, 8, 8, {genesisTransaction: 50});

const BLOCK_CREATE_INTERVAL: number = 10;
const DIFFICULTY_ADJUSTMENT_INTERVAL: number = 10;

let blockChain: Block[] = [genesisBlock];

/**
  * Getting last block from blockChain
  *
  * @return {Block}
*/
const getpreviousBlock = (): Block => blockChain[blockChain.length - 1];

const getDifficultyForNewBlock = (): number => {
  const lastBlock: Block = getpreviousBlock();
  if(lastBlock.height % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && lastBlock.height !== 0) {
    return getAdjustedDifficulty(lastBlock);
  }
  else {
    return getpreviousBlock().difficulty;
  }
}

const getAdjustedDifficulty = (lastBlock: Block): number => {
  const previousAdjustmentBlock: Block = blockChain[blockChain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
  const timeTaken: number = lastBlock.timestamp - previousAdjustmentBlock.timestamp;
  const timeExpected: number = BLOCK_CREATE_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;

  if(timeTaken < timeExpected / 2) {
    return previousAdjustmentBlock.difficulty + 1;
  }
  else if (timeTaken > timeExpected * 2) {
    return previousAdjustmentBlock.difficulty - 1;
  }
  else {
    return previousAdjustmentBlock.difficulty;
  }
}

/**
  * Checking chain correctness
  *
  * @return {bollean}
*/

const chainVerifing = (chain: Block[]): bollean => {
  if(chain[0] !== genesisBlock) {
    console.log("Invaild genesis block");
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
  const newBlock = createNewBlock(getpreviousBlock(), getDifficultyForNewBlock());
  if(isIntegral(newBlock, getpreviousBlock())){
    blockChain.push(newBlock);
  }

  setTimeout(function () {
    addNewBlockInBlockChain();
    console.log(blockChain[blockChain.length - 1]);
    console.log("clear");
  }, 100);
}

addNewBlockInBlockChain();
console.log(blockChain);

/**
  * To-do
  * Add replace chain function for received blockchain
  *
  *
*/
