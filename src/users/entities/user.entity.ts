import { UserRoles } from "src/helpers/userRoles"
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"
import { User } from "../models/schemas/User"
import { generateHash } from "../../helpers/generateHash"
import { genExpirationDate } from "../../helpers/genCodeExpirationDate"
import { UserInputModel } from "../models/input/UserInput"
import { v4 as uuidv4 } from 'uuid'

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

  public static async createUser(userDto: UserInputModel, isConfirmed: boolean, role: UserRoles): Promise<User> {
    const passwordHash = await generateHash(userDto.password)
    const expirationDate = genExpirationDate(1, 3)
    const newUser: User = {...userDto, password: passwordHash, createdAt: new Date().toISOString(), 
      confirmationEmail: { confirmationCode: uuidv4(), expirationDate: expirationDate.toISOString(), isConfirmed: isConfirmed},
      confirmationPassword: { confirmationCode: uuidv4(), expirationDate: expirationDate.toISOString() }, role, banInfo: {isBanned: false, banDate: null, banReason: null}
    }

    return newUser
  }
}
