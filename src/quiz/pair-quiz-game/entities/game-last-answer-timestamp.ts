import { UserEntity } from "../../../users/entities/user.entity"
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { QuizGameEntity } from "./quiz-game.entity";

@Entity('GameTimestamps')
export class GameTimestampsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => QuizGameEntity)
  @JoinColumn()
  game: UserEntity

  @Column({ type: 'uuid' })
  @JoinColumn()
  gameId: string

  @Column()
  isActive: boolean;

  @Column()
  createdAt: string

  @Column()
  isFirstPlayerEndFirst: boolean
}