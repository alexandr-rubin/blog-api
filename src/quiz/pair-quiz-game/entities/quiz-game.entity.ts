import { GameStatuses } from "../../../helpers/gameStatuses"
import { UserEntity } from "../../../users/entities/user.entity"
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { QuestionViewModel } from "../models/view/Questions"

@Entity('QuizGames')
export class QuizGameEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn()
  playerOne: UserEntity;

  @Column({ type: 'uuid' })
  playerOneId: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn()
  playerTwo: UserEntity;

  @Column({ type: 'uuid', nullable: true })
  playerTwoId: string;

  @Column({type: 'character varying'})
  status: GameStatuses

  @Column()
  pairCreatedDate: string;

  @Column({ nullable: true })
  startGameDate: string;

  @Column({ nullable: true })
  finishGameDate: string;

  @Column({type: 'jsonb'})
  questions: QuestionViewModel[]

  @Column({ default: 0 })
  firstPlayerScore: number;

  @Column({ default: 0 })
  secondPlayerScore: number;
}