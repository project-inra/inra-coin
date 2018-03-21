// @flow
import crypto from "crypto";
import { hexToBinary } from "./util";

export type BlockPayload = {
  index: number,
  hash: string,
  previousHash: string | null,
  timestamp: number,
  difficulty: number,
  nonce: number,
  data: Object
};

/**
 * "Nodes collect new transactions into a block, hash them into a hash tree, and
 * scan through nonce values to make the block's hash satisfy proof-of-work
 * requirements. When they solve the proof-of-work, they broadcast the block to
 * everyone and the block is added to the block chain. The first transaction in
 * the block is a special one that creates a new coin owned by the creator of
 * the block." ~ Satoshi Nakamoto
 *
 * @namespace   block
 * @memberof    blockchain
 * @class
 */
export default class Block {
  // Index of the current block
  index: number;
  // Hash of the current block
  hash: string;
  // Hash of the previous block
  previousHash: string | null;
  // Creation date of the current block
  timestamp: number;
  // Difficulty defines how many prefixing zeros the block hash must have
  difficulty: number;
  // Nonce is used to find a hash that satisfies the difficulty
  nonce: number;
  // Transaction data contained in the block
  data: Object;

  /**
   * @param   {Object}  payload
   * @param   {number}  payload.index         Position in chain
   * @param   {string}  payload.hash          ID of the current block
   * @param   {string}  payload.previousHash  ID of the previous block
   * @param   {number}  payload.timestamp     Creation date
   * @param   {number}  payload.difficulty    Creation difficulty
   * @param   {Object}  payload.data          Transaction list
   */
  constructor(payload: BlockPayload): void {
    this.index = payload.index;
    this.hash = payload.hash;
    this.previousHash = payload.previousHash;
    this.timestamp = payload.timestamp;
    this.difficulty = payload.difficulty;
    this.nonce = payload.nonce;
    this.data = payload.data;
  }

  /**
   * Generates a block ID for a given payload.
   *
   * @param   {Object}      payload
   * @return  {string}
   * @static
   */
  static generateID(payload: Object): string {
    let { index, previousHash, timestamp, difficulty, nonce, data } = payload;

    data = JSON.stringify(data);

    return crypto
      .createHmac("sha256", "temporarySecretKey")
      .update(`${index}${previousHash}${timestamp}${data}${difficulty}${nonce}`)
      .digest("hex");
  }

  /**
   * Check whether the given id is not corrupted.
   *
   * @param   {Block}     block         Block to check
   * @return  {boolean}
   * @static
   */
  static verifyID(block: Block): boolean {
    return Block.generateID(block) === block.hash;
  }

  /**
   * Check whether the given id verifies the required difficulty.
   *
   * @param   {string}    id            Block id
   * @param   {number}    difficulty    Block difficulty
   * @return  {boolean}
   * @static
   */
  static verifyDifficulty(id: string, difficulty: number): boolean {
    return hexToBinary(id).startsWith("0".repeat(difficulty));
  }
}
