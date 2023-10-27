import { GameStatuses } from "../../../../helpers/gameStatuses"
import { QuestionViewModel } from "../view/Questions"

export class CreateQuizGameInputModel {
  playerOneId: string
  status: GameStatuses
  pairCreatedDate: string
  questions: QuestionViewModel[]
}