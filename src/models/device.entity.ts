import { UUID } from "crypto"
import { UserEntity } from "../users/entities/user.entity"
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
  @ManyToOne(() => UserEntity, {onDelete: 'CASCADE'})
  user: UserEntity
  @Column('uuid')
  userId: string
  @Column()
  isValid: boolean
}