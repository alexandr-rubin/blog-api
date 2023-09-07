import { UserRoles } from '../../../helpers/userRoles';
import { UUID } from 'crypto';

export class SQLUser {
  id: UUID
  login!: string
  password!: string
  email!: string
  createdAt!: string
  confirmationEmail!: {
    confirmationCode: string,
    expirationDate: string,
    isConfirmed: boolean
  }
  confirmationPassword! : {
    confirmationCode: string, 
    expirationDate: string
  }
  role!: UserRoles
  banInfo!: {
    isBanned: boolean,
    banDate: string | null,
    banReason: string | null
  }
}