import { GameStatuses } from "../../../../helpers/gameStatuses"
import { GamePlayerProgress } from "./GamePlayerProgress"
import { QuestionViewModel } from "./Questions"

export class GamePairViewModel {
  id!: string
  firstPlayerProgress!: GamePlayerProgress
  secondPlayerProgress!: GamePlayerProgress
  questions: QuestionViewModel[]
  status!: GameStatuses
  pairCreatedDate!: string
  startGameDate: string
  finishGameDate: string
}