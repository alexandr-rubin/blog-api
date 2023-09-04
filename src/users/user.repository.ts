import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { LoginValidation } from "../validation/login";
import { User, UserDocument } from "./models/schemas/User";

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>){}
  async createUser(newUser: User): Promise<UserDocument> {
    const user = new this.userModel(newUser)
    const save = (await user.save()).toJSON()
    return save
  }

  async deleteUserById(id: string): Promise<boolean> {
    const result = await this.userModel.findByIdAndDelete(id)
    return !!result
  }
  //
  async deleteUsersTesting(): Promise<boolean> {
    const result = await this.userModel.deleteMany({})
    return !!result
  }

  async updateConfirmation(user: UserDocument): Promise<User> {
    const result = await user.save()
    return result.toJSON()
  }

  async updateConfirmationCode(user: UserDocument): Promise<User> {
    const result = await user.save()
    return result.toJSON()
  }
  async updateconfirmationPasswordData(user: UserDocument): Promise<User> {
    const result = await user.save()
    return result.toJSON()
  } 

  async updatePassword(password: string, code: string): Promise<boolean> {
    const result = await this.userModel.updateOne({'confirmationPassword.confirmationCode': code}, {password: password})
    return result.modifiedCount === 1
  }

  async verifyUser(loginData: LoginValidation): Promise<UserDocument | null> {
    return await this.userModel.findOne({$or: [{login: loginData.loginOrEmail}, {email: loginData.loginOrEmail}]})
  }

  async banOrUnbanUserById(userId: string, isBanned: boolean, banReason: string, banDate: string): Promise<boolean> {
    const result = await this.userModel.findByIdAndUpdate(userId, {banInfo: {isBanned: isBanned, banDate: banDate, banReason: banReason}})
    return !!result
  }
}