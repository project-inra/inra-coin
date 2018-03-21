// @flow
import Block from "../Block";
import Chain from "../Chain";

const BLOCK_CREATE_INTERVAL: number = 1000;
const DIFFICULTY_ADJUSTMENT_INTERVAL: number = 10;

const genesisBlock: Block = new Block({
  index: 0,
  hash: "8b5836b5ebd62f841a4b7a6476d1f1a8d61a56206904546195278ca2a320b84e",
  previousHash: null,
  timestamp: 1521077085,
  difficulty: 8,
  nonce: 8,
  data: { genesisTransaction: 50 }
});

const blockchain = new Chain(genesisBlock);

const getDifficultyForNewBlock = (): number => {
  const lastBlock: Block = blockchain.last;

  if (
    lastBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 &&
    lastBlock.index !== 0
  ) {
    return getAdjustedDifficulty(lastBlock);
  } else {
    return lastBlock.difficulty;
  }
};

const getAdjustedDifficulty = (lastBlock: Block): number => {
  const previousAdjustmentBlock: Block = // $FlowFixMe
    blockchain.blocks[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];

  const timeTaken: number =
    lastBlock.timestamp - previousAdjustmentBlock.timestamp;

  const timeExpected: number =
    BLOCK_CREATE_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;

  if (timeTaken < timeExpected / 2)
    return previousAdjustmentBlock.difficulty + 1;

  if (timeTaken > timeExpected * 2)
    return previousAdjustmentBlock.difficulty - 1;

  return previousAdjustmentBlock.difficulty;
};

/**
 * Adding new block in block chain
 *
 * @return {void}
 */
const addNewBlockInBlockChain = (): void => {
  const newBlock = blockchain.generateBlock(getDifficultyForNewBlock());

  if (blockchain.isValid(newBlock, blockchain.last)) {
    blockchain.push(newBlock);
  }

  setTimeout(function() {
    addNewBlockInBlockChain();
    console.log(blockchain.last);
  }, 100);
};

addNewBlockInBlockChain();
