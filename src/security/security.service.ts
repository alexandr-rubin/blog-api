import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { SecurityRepository } from "./security.repository";
import { APILog } from "./models/schemas/APILogs";
import { UpdateResult } from "typeorm";

@Injectable()
export class SecurityService {
  constructor(private jwtService: JwtService, private securityRepository: SecurityRepository){}

  async terminateAllDeviceSessions(token: string): Promise<UpdateResult>{
    const decodedToken = await this.jwtService.verifyAsync(token)
    const isTerminated = await this.securityRepository.terminateAllDeviceSessions(decodedToken.userId, decodedToken.deviceId)
    return isTerminated
  }

  async terminateSpecifiedDeviceSessions(deviceId: string, token: string): Promise<UpdateResult> {
    const decodedToken= await this.jwtService.verifyAsync(token)
    const isTerminated = await this.securityRepository.terminateSpecifiedDeviceSessions(deviceId, decodedToken.userId)
    return isTerminated
  }

  async addLog(logEntry: APILog): Promise<APILog> {
    return await this.securityRepository.addLog(logEntry)
  }

  async countDoc(filter:any): Promise<number> {
    return await this.securityRepository.countDoc(filter)
  }

  async deleteAllAPILogsTesting() {
    const result = await this.securityRepository.deleteAllAPILogsTesting()
    return result
  }

  async deleteAllDevicesTesting(): Promise<boolean> {
    const result = await this.securityRepository.deleteAllDevicesTesting()
    return !!result
  }

  async terminateBannedUserSessions(userId: string): Promise<UpdateResult>{
    const isTerminated = await this.securityRepository.terminateBannedUserSessions(userId)
    return isTerminated
  }
}