import {createBlockId} from "./createBlock";
import {hexToBinary} from "hexToBinary";

const isRespectivelyDifficult = (id: string, difficulty: number): bollean => {
  return hexToBinary(id).startWith("0".repeat(difficulty));
}

const findBlockId = (height: number, pervousId: string, timestamp: number, data: object, difficulty: number): string => {
  let nonce: number = 0;
  while(true) {
    const id = createBlockId(height, pervousId, timestamp, data, difficulty, nonce);
    if(isRespectivelyDifficult(id, difficulty)){
      
    }
    nonce++;
  }
}
