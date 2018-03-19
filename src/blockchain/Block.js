// @flow
import crypto from "crypto";
import { hexToBinary } from "./util";

export type BlockPayload = {
  height: number,
  id: string,
  previousId: string | null,
  timestamp: number,
  difficulty: number,
  nonce: number,
  data: Object
};

export default class Block {
  height: number;
  id: string;
  previousId: string | null;
  timestamp: number;
  difficulty: number;
  nonce: number;
  data: Object;

  /**
   * @param   {Object}  payload
   * @param   {number}  payload.height        Position in chain
   * @param   {string}  payload.id            ID of the current block
   * @param   {string}  payload.previousId    ID of the previous block
   * @param   {number}  payload.timestamp     Creation date
   * @param   {number}  payload.difficulty    Creation difficulty
   * @param   {Object}  payload.data          Transaction list
   */
  constructor(payload: BlockPayload): void {
    this.height = payload.height;
    this.id = payload.id;
    this.previousId = payload.previousId;
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
    let { height, previousId, timestamp, difficulty, nonce, data } = payload;

    data = JSON.stringify(data);

    return crypto
      .createHmac("sha256", "temporarySecretKey")
      .update(`${height}${previousId}${timestamp}${data}${difficulty}${nonce}`)
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
    return Block.generateID(block) === block.id;
  }

  /**
   * Check whether the given id verifies the required difficulty.
   *
   * @param   {string}    id            Block idea
   * @param   {number}    difficulty    Block difficulty
   * @return  {boolean}
   * @static
   */
  static verifyDifficulty(id: string, difficulty: number): boolean {
    return hexToBinary(id).startsWith("0".repeat(difficulty));
  }
}
