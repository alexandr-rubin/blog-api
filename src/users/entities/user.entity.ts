import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity('Users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string
  @Column()
  login: string
  @Column()
  password: string
  @Column()
  email: string
  @Column()
  createdAt: string
  @Column('jsonb')
  confirmationEmail: {
    confirmationCode: string,
    expirationDate: string,
    isConfirmed: boolean
  }
  @Column('jsonb')
  confirmationPassword: {
    confirmationCode: string, 
    expirationDate: string
  }
  @Column()
  role: string
  @Column('jsonb')
  banInfo: {
    isBanned: boolean,
    banDate: string | null,
    banReason: string | null
  }
}