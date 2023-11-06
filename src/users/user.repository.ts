import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { LoginValidation } from "../validation/login";
import { User, UserDocument } from "./models/schemas/User";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, DeleteResult, Repository, UpdateResult } from "typeorm";
import { UserEntity } from "./entities/user.entity";

@Injectable()
export class UserRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource, @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>){}
  //типизация
  async createUser(newUser: User) {
    return (await this.userRepository.save(newUser)).id
  }

  async deleteUserById(id: string): Promise<DeleteResult> {
    return await this.userRepository.delete(id)
  }
  //
  async deleteUsersTesting(): Promise<boolean> {
    return await this.dataSource.query(`
    DELETE FROM public."Users"
    `)
  }

  async updateConfirmation(user: UserEntity): Promise<UpdateResult> {
    return await this.userRepository.update( { id: user.id }, { confirmationEmail: { isConfirmed: user.confirmationEmail.isConfirmed, expirationDate: user.confirmationEmail.expirationDate,
      confirmationCode: user.confirmationEmail.confirmationCode } })
  }

  async updateConfirmationCode(user: UserEntity): Promise<UpdateResult> {
    return await this.userRepository.update( { id: user.id }, { confirmationEmail: { isConfirmed: user.confirmationEmail.isConfirmed, expirationDate: user.confirmationEmail.expirationDate,
      confirmationCode: user.confirmationEmail.confirmationCode } })
  }
  async updateconfirmationPasswordData(user: UserEntity): Promise<UpdateResult> {
    return await this.userRepository.update( { id: user.id }, { confirmationPassword: { expirationDate: user.confirmationPassword.expirationDate,
      confirmationCode: user.confirmationPassword.confirmationCode } })
  } 

  async updatePassword(password: string, code: string): Promise<UpdateResult> {
    return await this.userRepository
    .createQueryBuilder()
    .update(UserEntity)
    .set({ password: password })
    .where('"confirmationPassword"->>\'confirmationCode\' = :code', { code: code })
    .execute();
  }

  async verifyUser(loginData: LoginValidation): Promise<UserEntity | null> {
    const loginOrEmail = loginData.loginOrEmail
    const user = await this.userRepository
    .createQueryBuilder()
    .where('login = :loginOrEmail OR email = :loginOrEmail', { loginOrEmail })
    .getOne();

    return user
  }

  async banOrUnbanUserById(userId: string, isBanned: boolean, banReason: string, banDate: string): Promise<UpdateResult> {
    const result = await this.userRepository.update({id: userId}, {banInfo: {isBanned: isBanned, banDate: banDate, banReason: banReason}})
    return result
  }
}