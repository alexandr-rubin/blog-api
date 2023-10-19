import { GameStatuses } from "../../../helpers/gameStatuses"
import { UserEntity } from "../../../users/user.entity"
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { QuestionViewModel } from "../models/view/Questions"

@Entity('QuizGames')
export class QuizGameEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string
  @ManyToOne(() => UserEntity)
  player1: UserEntity
  @Column({ type: 'uuid'})
  player1Id: string
  @ManyToOne(() => UserEntity)
  player2: UserEntity
  @Column({ type: 'uuid', nullable: true })
  player2Id: string
  @Column({type: 'character varying'})
  status: GameStatuses
  @Column()
  pairCreatedDate: string
  @Column({nullable: true})
  startGameDate: string
  @Column({nullable: true})
  finishGameDate: string
  @Column({type: 'jsonb'})
  questions: QuestionViewModel[]
}