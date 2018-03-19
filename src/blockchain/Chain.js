// @flow
import Block from "./Block";
import { getTimestamp } from "./util";
import type { BlockPayload } from "./Block";

export default class Chain {
  blocks: Array<Block> = [];

  constructor(genesisBlock: Block): void {
    this.blocks = [genesisBlock];
  }

  push(newBlock: Block): void {
    const oldBlock = this.blocks[this.blocks.length - 1];

    if (this.isValid(newBlock, oldBlock)) {
      this.blocks.push(newBlock);
    }
  }

  isValid(newBlock: Block, oldBlock: Block): boolean {
    if (newBlock.height !== oldBlock.height + 1) {
      throw new Error("Invalid height");
    }

    if (newBlock.previousId !== oldBlock.id) {
      throw new Error("Invalid previous block id");
    }

    if (!Block.verifyID(newBlock)) {
      throw new Error("Corrupted block id");
    }

    if (!Block.verifyDifficulty(newBlock.id, newBlock.difficulty)) {
      throw new Error("Corrupted block difficulty");
    }

    // "To mitigate the attack where a false timestamp is introduced in order to
    // manipulate the difficulty the following rules is introduced:
    // • A block is valid, if the timestamp is at most 1 min in the future from
    //  the time we perceive;
    // • A block in the chain is valid, if the timestamp is at most 1 min in the
    //  past of the previous block;""
    // ~ https://lhartikk.github.io/jekyll/update/2017/07/13/chapter2.html
    if (
      newBlock.timestamp <= oldBlock.timestamp - 60 &&
      newBlock.timestamp <= getTimestamp() + 60
    ) {
      throw new Error("Invalid timestamp");
    }

    return true;
  }

  isCorrupted(): boolean {
    for (let i = 1; i < this.blocks.length; i++) {
      const prev = this.blocks[i - 1];
      const next = this.blocks[i];

      if (!this.isValid(next, prev)) return true;
    }

    return false;
  }

  // $FlowFixMe we are always returning a Block
  generateBlock(difficulty: number): Block {
    const currentHeight = this.blocks.length - 1;
    const previousBlock = this.blocks[currentHeight];
    const timestamp = getTimestamp();

    // Add transactions:
    const transaction: Object = { Transaction: 50 };

    const payload: BlockPayload = {
      id: "",
      height: currentHeight + 1,
      previousId: previousBlock.id,
      timestamp: timestamp,
      data: transaction,
      difficulty: difficulty,
      nonce: 0
    };

    while (true) {
      payload.id = Block.generateID(payload);

      if (Block.verifyDifficulty(payload.id, difficulty)) {
        return new Block(payload);
      }

      payload.nonce++;
    }
  }

  get genesis(): Block {
    return this.blocks[0];
  }

  get last(): Block {
    return this.blocks[this.blocks.length - 1];
  }

  get length(): number {
    return this.blocks.length;
  }
}
