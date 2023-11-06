import { Injectable, NotFoundException } from "@nestjs/common";
import { UserRepository } from "./user.repository";
import { UserInputModel } from "./models/input/UserInput";
import { UserViewModel } from "./models/view/UserView";
import { User } from "./models/schemas/User";
import { UserRoles } from "../helpers/userRoles";
import { UpdateResult } from "typeorm";

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository){}

  async createUser(userDto: UserInputModel): Promise<UserViewModel> {
    const newUser: User = await User.createUser(userDto, true, UserRoles.Admin)

    const id = await this.userRepository.createUser(newUser)
    const {...result} = {id: id, ...newUser, 
      /*banInfo: {isBanned: user.banInfo.isBanned, banDate: user.banInfo.banDate, banReason: user.banInfo.banReason},*/
      confirmationEmail: undefined, confirmationPassword: undefined,password: undefined, banInfo: undefined, role: undefined}
    return result
  }
  //
  async deleteUserById(id: string): Promise<boolean> {
    const isDeleted = await this.userRepository.deleteUserById(id)
    if(isDeleted.affected === 0){
      throw new NotFoundException()
    }
    return isDeleted.affected > 0
  }
  //
  async deleteUsersTesting(): Promise<boolean> {
    const result = await this.userRepository.deleteUsersTesting()
    return result
  }

  async banOrUnbanUserById(userId: string, isBanned: boolean, banReason: string): Promise<UpdateResult> {
    const banDate = isBanned ? new Date().toISOString() : null
    banReason = isBanned ? banReason : null
    return await this.userRepository.banOrUnbanUserById(userId, isBanned, banReason, banDate)
  }
}