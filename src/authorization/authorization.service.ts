import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { UserRepository } from "../users/user.repository";
import { EmailService } from "./email.service";
import { UserQueryRepository } from "../users/user.query-repository";
import { v4 as uuidv4 } from 'uuid'
import { genExpirationDate } from "../helpers/genCodeExpirationDate";
import { generateHash } from "../helpers/generateHash";
import { LoginValidation } from "../validation/login";
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs'
import { Device } from "../models/Device";
import { AuthorizationRepository } from "./authorization.repository";
import { CreateJWT } from "./models/output/JWTresponce";
import { ConfigService } from "@nestjs/config";
import { ConfigType } from "../config/configuration";
import { User } from "../users/models/schemas/User";
import { UserInputModel } from "../users/models/input/UserInput";
import { UserRoles } from "../helpers/userRoles";

@Injectable()
export class AuthorizationService {
  constructor(private userRepository: UserRepository, private emailService: EmailService, private readonly userQueryRepository: UserQueryRepository, 
  private jwtService: JwtService, private authorizationRepository: AuthorizationRepository, private configService: ConfigService<ConfigType>){}

  async createUser(userDto: UserInputModel): Promise<User> {
    const newUser: User = await User.createUser(userDto, false, UserRoles.User)
    // какой репо
    const createdUser = await this.userRepository.createUser(newUser)
    await this.emailService.sendRegistrationConfirmationEmail(newUser.email, newUser.confirmationEmail.confirmationCode)
    return createdUser
  }

  async confrmEmail(code: string): Promise<User>{
    const user = await this.userQueryRepository.findUserByConfirmationEmailCode(code)
    //ныжны ли проверки если есть проверка в мидлваре
    if (!user)
      throw new BadRequestException()
    if (user.confirmationEmail.isConfirmed)
      throw new BadRequestException()
    if(new Date(user.confirmationEmail.expirationDate) < new Date()){
      throw new BadRequestException()
    }
    user.confirmationEmail.isConfirmed = true
    const updatedUser = await this.userRepository.updateConfirmation(user)
    return updatedUser
  }
  async resendEmail(email: string): Promise<User>{
    const user = await this.userQueryRepository.getUsergByEmail(email)
    // middlware
    if (!user)
      throw new BadRequestException('User not found.')
    if (user.confirmationEmail.isConfirmed)
      throw new BadRequestException('User is confirmed.')
    if(new Date(user.confirmationEmail.expirationDate) < new Date()){
      throw new BadRequestException('Token is expired.')
    }
    const code = uuidv4()
    user.confirmationEmail.confirmationCode = code
    user.confirmationEmail.expirationDate = genExpirationDate(1, 3).toISOString()
    const updatedUser = await this.userRepository.updateConfirmationCode(user)
    await this.emailService.sendRegistrationConfirmationEmail(email, code)
    return updatedUser
  }

  async recoverPassword(email: string): Promise<User> {
    const user = await this.userQueryRepository.getUsergByEmail(email)
    if(!user){
      return
    }

    const code = uuidv4()
    const expirationDate = genExpirationDate(1, 3)

    user.confirmationPassword.confirmationCode = code
    user.confirmationPassword.expirationDate = expirationDate.toISOString()
    const updatedUser = await this.userRepository.updateconfirmationPasswordData(user)
    
    await this.emailService.sendPasswordRecoverEmail(email, code)

    return updatedUser
  }

  async updatePassword(password: string, code: string): Promise<boolean>{
    const passwordHash = await generateHash(password)
    const isUpdated = await this.userRepository.updatePassword(passwordHash, code)
    if(!isUpdated){
      throw new BadRequestException()
    }

    return true
  }

  async verifyUser(loginData: LoginValidation): Promise<string> {
    const user = await this.userRepository.verifyUser(loginData)
    if(user){
      try {
        const isMatch = await compare(loginData.password, user.password)
        if(isMatch){
          return user._id.toString()
        }
        throw new UnauthorizedException()
      } catch (error) {
        console.error('Error comparing passwords:', error);
        throw new UnauthorizedException()
      }
      
    }
    
    throw new UnauthorizedException()
  }

  ////
  async createJWT(userId: string, deviceId: string, issuedAt: string): Promise<CreateJWT> {
    const JWT_SECRET_KEY = this.configService.get('JWT_SECRET_KEY')
    const accessTokenPayload = { userId: userId, JWT_SECRET_KEY }
    const refreshTokenPayload = { deviceId: deviceId, userId: userId, issuedAt: issuedAt }
    const result = {
      accessToken: await this.jwtService.signAsync(accessTokenPayload),
      refreshToken: await this.jwtService.signAsync(refreshTokenPayload, { expiresIn: '20s' })
    }
    return result
  }

  async signIn(userId: string, userAgent: string | undefined, clientIP: string){
    if (!userAgent){
      //
      userAgent = 'default device name'
    }
    const deviceId = uuidv4()
    const issuedAt = new Date().toISOString()
    const tokens = await this.createJWT(userId, deviceId, issuedAt)
    const decodedToken = await this.jwtService.verifyAsync(tokens.refreshToken)
    const expirationDate = new Date(decodedToken.exp * 1000)
    const device: Device = {issuedAt: issuedAt, expirationDate: expirationDate.toISOString(), IP: clientIP, deviceName: userAgent, deviceId: deviceId, userId: userId, isValid: true}
    ////
    await this.authorizationRepository.addDevice(device)

    return tokens
  }

  async updateDevice(refreshToken: string, clientIP: string, userAgent: string | undefined): Promise<CreateJWT | null> {
    const decodedToken = await this.jwtService.verifyAsync(refreshToken)
    if (!userAgent){
        userAgent = 'default device name'
    }
    const deviceId = decodedToken.deviceId
    const issuedAt = new Date().toISOString()
    const userId = decodedToken.userId
    const tokens = await this.createJWT(userId, deviceId, issuedAt)
    const decodedNewToken = await this.jwtService.verifyAsync(tokens.refreshToken)
    const expirationDate = new Date(decodedNewToken.exp * 1000)
    const newDevice: Device = {issuedAt: issuedAt, expirationDate: expirationDate.toISOString(), IP: clientIP, deviceName: userAgent, deviceId: deviceId, userId: userId, isValid: true}
    const isUpdated = await this.authorizationRepository.updateDevice(newDevice)
    if(!isUpdated){
      return null
    }
    return tokens
  }

  async logoutDevice(refreshToken: string): Promise<Device>{
    ////
    const decodedToken = await this.jwtService.verifyAsync(refreshToken)
    const isLogedout = await this.authorizationRepository.logoutDevice(decodedToken.deviceId)
    return isLogedout
  }

  async getUserIdByToken(token: string) {
    try {
      const result = await this.jwtService.verifyAsync(token)
      return result.userId
    } catch (err) {
      return null
    }
  }
}