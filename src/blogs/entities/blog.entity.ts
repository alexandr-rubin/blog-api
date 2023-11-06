import { UserEntity } from "../../users/entities/user.entity"
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"

@Entity('Blogs')
export class BlogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string
  @Column()
  name: string
  @Column()
  description: string
  @Column()
  websiteUrl: string
  @Column()
  createdAt: string
  @Column()
  isMembership!: boolean
  @ManyToOne(() => UserEntity, {onDelete: 'CASCADE'})
  user: UserEntity
  @Column({ type: 'uuid', nullable: true })
  userId: string
  @Column('jsonb')
  banInfo: {
    isBanned: boolean,
    banDate: string | null
  }
}