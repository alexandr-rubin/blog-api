import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Device, DeviceDocument } from "../models/Device";
import { APILog, APILogDocument } from "./models/schemas/APILogs";

@Injectable()
export class SecurityRepository {
  constructor(@InjectModel(Device.name) private deviceModel: Model<DeviceDocument>, @InjectModel(APILog.name) private APILogModel: Model<APILogDocument>) {}
  async terminateAllDeviceSessions(userId: string, deviceId: string): Promise<boolean> {
    const isTerminated = (await this.deviceModel.deleteMany({userId: userId, deviceId: {$ne: deviceId}})).acknowledged
    return isTerminated
  }

  async terminateSpecifiedDeviceSessions(deviceId: string, userId: string): Promise<boolean | null> {
    // возвращать объект как в комментах
    const device = await this.deviceModel.findOne({deviceId: deviceId})
    if(!device){
      throw new NotFoundException()
    }
    if(device.userId !== userId) {
      throw new ForbiddenException()
    }
    const isTerminated = (await this.deviceModel.deleteOne({deviceId: deviceId})).acknowledged
    return isTerminated
  }

  async terminateBannedUserSessions(userId: string): Promise<boolean> {
    const isTerminated = (await this.deviceModel.deleteMany({userId: userId})).acknowledged
    return isTerminated
  }

  async addLog(logEntry: APILog): Promise<APILog> {
    const newAPILog = new this.APILogModel(logEntry)
    const save = await newAPILog.save()
    return save
  }

  async countDoc(filter:any): Promise<number> {
    const count = await this.APILogModel.countDocuments(filter)
    return count
  }

  async deleteAllAPILogsTesting(): Promise<boolean> {
    const result = await this.APILogModel.deleteMany({})
    return !!result
  }

  async deleteAllDevicesTesting(): Promise<boolean> {
    const result = await this.deviceModel.deleteMany({})
    return !!result
  }
}