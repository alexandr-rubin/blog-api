import { UserEntity } from "../../../users/user.entity"
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { QuizGameEntity } from "./quiz-game.entity"
import { AnswerStatuses } from "../../../helpers/answerStatuses"
import { QuizQuestionEntity } from "../../../quiz/quiz-questions/entities/quiz-question.entity"

@Entity('QuizAnswers')
export class QuizAnswersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string
  @ManyToOne(() => QuizGameEntity)
  game: UserEntity
  @Column({ type: 'uuid'})
  gameId: string
  @ManyToOne(() => QuizQuestionEntity)
  question: QuizQuestionEntity
  @Column({ type: 'uuid' })
  questionId: string
  @ManyToOne(() => UserEntity)
  user: UserEntity
  @Column({ type: 'uuid' })
  userId: string
  @Column()
  userAnswer: string
  @Column()
  answerStatus: AnswerStatuses
  @Column()
  addedAt: string
}