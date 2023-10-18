import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"

@Entity('QuizQuestions')
export class QuizQuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string
  @Column()
  body: string
  @Column('jsonb')
  correctAnswers: object
  @Column()
  published: boolean
  @Column()
  createdAt: string
  @UpdateDateColumn({default: new Date(), nullable: true})
  updatedAt: string
}