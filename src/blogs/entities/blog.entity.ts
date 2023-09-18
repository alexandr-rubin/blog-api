import { UserEntity } from "../../users/user.entity"
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { UUID } from "typeorm/driver/mongodb/bson.typings"

@Entity('Blogs')
export class BlogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: UUID
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
  @ManyToOne(() => UserEntity)
  user: UserEntity
  @Column('uuid')
  userId: UUID
  @Column('jsonb')
  banInfo: {
    isBanned: boolean,
    banDate: string | null
  }
}