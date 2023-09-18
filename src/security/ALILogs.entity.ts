import { UUID } from "crypto"
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity('APILogs')
export class APILogEntity {
    @PrimaryGeneratedColumn('uuid')
    id: UUID
    @Column()
    IP: string
    @Column()
    URL: string
    @Column()
    date: string
}