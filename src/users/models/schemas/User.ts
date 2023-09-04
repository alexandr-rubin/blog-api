import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid'
import { UserInputModel } from '../input/UserInput';
import { generateHash } from '../../../helpers/generateHash';
import { genExpirationDate } from '../../../helpers/genCodeExpirationDate';
import { UserRoles } from '../../../helpers/userRoles';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  login!: string
  @Prop()
  password!: string
  @Prop()
  email!: string
  @Prop()
  createdAt!: string
  @Prop({type: {
    confirmationCode: String,
    expirationDate: String,
    isConfirmed: Boolean
  }})
  confirmationEmail!: {
    confirmationCode: string,
    expirationDate: string,
    isConfirmed: boolean
  }
  @Prop({type: {
    confirmationCode: String, 
    expirationDate: String
  }})
  confirmationPassword! : {
    confirmationCode: string, 
    expirationDate: string
  }
  @Prop()
  role!: UserRoles
  @Prop({type: {
    isBanned: Boolean,
    banDate: String,
    banReason: String
  }})
  banInfo!: {
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

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('id').get(function () {
  return this._id.toString();
})