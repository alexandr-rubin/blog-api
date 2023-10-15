import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

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
  @Column()
  updatedAt: string
}