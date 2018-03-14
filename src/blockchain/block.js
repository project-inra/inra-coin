/**
  * Block pattern
*/

export default class Block {
  height: number;
  id: string;
  pervousId: string;
  timestamp: number;
  difficulty: number;
  nonce: number;
  data: object;


  /**
    * @param  {number}  height position in chain
    * @param  {string}  id unique block id
    * @param  {string}  pervousId id of the previous block
    * @param  {number}  timestamp time of creation block
    * @param  {number}  difficulty difficulty create block
    * @param  {object}  data transaction list
  */

  constructor(height: number, id: string, pervousId: string, timestamp: number, difficulty: number, nonce: number, data: object) {
    this.height = height;
    this.id = id;
    this.pervousId = pervousId;
    this.timestamp = timestamp;
    this.difficulty = difficulty;
    this.nonce = nonce;
    this.data = data;
  }
}
