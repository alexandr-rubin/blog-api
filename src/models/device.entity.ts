import { UUID } from "crypto"
import { UserEntity } from "../users/user.entity"
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"

@Entity('Devices')
export class DeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: UUID
  @Column()
  issuedAt: string
  @Column()
  expirationDate: string
  @Column()
  IP: string
  @Column()
  deviceName: string
  @Column()
  deviceId: string
  @ManyToOne(() => UserEntity)
  user: UserEntity
  @Column('uuid')
  userId: UUID
  @Column()
  isValid: boolean
}