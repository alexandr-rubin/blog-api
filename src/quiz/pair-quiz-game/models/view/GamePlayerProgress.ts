import { AnswerViewModel } from "./Answer";
import { PlayerViewModel } from "./Player";

export class GamePlayerProgress {
  answers: AnswerViewModel[]
  player: PlayerViewModel
  score: number
}