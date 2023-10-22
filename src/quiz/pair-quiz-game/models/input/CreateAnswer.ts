import { AnswerStatuses } from "../../../../helpers/answerStatuses"

export class CreateAnswerInputModel {
  gameId: string
  questionId: string
  userId: string
  userAnswer: string
  answerStatus: AnswerStatuses
  addedAt: string
}