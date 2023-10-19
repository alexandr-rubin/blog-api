import { GameStatuses } from "../../../../helpers/gameStatuses"
import { QuestionViewModel } from "../view/Questions"

export class CreateQuizGameInputModel {
  player1Id: string
  status: GameStatuses
  pairCreatedDate: string
  questions: QuestionViewModel[]
}