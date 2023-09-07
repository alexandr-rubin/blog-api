import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Device, DeviceDocument } from "../models/Device";
import { APILog, APILogDocument } from "./models/schemas/APILogs";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class SecurityRepository {
  constructor(@InjectModel(Device.name) private deviceModel: Model<DeviceDocument>, @InjectModel(APILog.name) private APILogModel: Model<APILogDocument>,
  @InjectDataSource() protected dataSource: DataSource) {}
  async terminateAllDeviceSessions(userId: string, deviceId: string) {
    // const isTerminated = (await this.deviceModel.deleteMany({userId: userId, deviceId: {$ne: deviceId}})).acknowledged
    // return isTerminated
    return await this.dataSource.query(`
    DELETE FROM public."Devices"
    WHERE "userId" = $1 AND "deviceId" != $2`,
    [userId, deviceId]);
  }

  async terminateSpecifiedDeviceSessions(deviceId: string, userId: string): Promise<boolean | null> {
    // возвращать объект как в комментах
    //const device = await this.deviceModel.findOne({deviceId: deviceId})
    const device = (await this.dataSource.query(`SELECT * FROM public."Devices" 
      WHERE "deviceId" = $1`, [deviceId]))[0]
    if(!device){
      throw new NotFoundException()
    }
    if(device.userId !== userId) {
      throw new ForbiddenException()
    }
    // const isTerminated = (await this.deviceModel.deleteOne({deviceId: deviceId})).acknowledged
    // return isTerminated
    return await this.dataSource.query(`
    DELETE FROM public."Devices"
    WHERE "deviceId" = $1`,
    [deviceId]);
  }

  async terminateBannedUserSessions(userId: string): Promise<boolean> {
    const isTerminated = (await this.deviceModel.deleteMany({userId: userId})).acknowledged
    return isTerminated
  }

  async addLog(logEntry: APILog): Promise<APILog> {
    // const newAPILog = new this.APILogModel(logEntry)
    // const save = await newAPILog.save()
    // return save
    return await this.dataSource.query(`INSERT INTO public."APILogs"(
      id, "IP", "URL", date)
      VALUES (uuid_generate_v4(), $1, $2, $3)`, [logEntry.IP, logEntry.URL, logEntry.date])
  }

  async countDoc(filter:any): Promise<number> {
    // const count = await this.APILogModel.countDocuments(filter)
    // return count
    const result = await this.dataSource.query(`
    SELECT COUNT(*)
    FROM public."APILogs"
    WHERE "IP" = $1
      AND "URL" = $2
      AND "date" >= $3
    `, [
      filter.IP,
      filter.URL,
      filter.date.$gte,
    ])

    return result[0].count
  }

  async deleteAllAPILogsTesting(): Promise<boolean> {
    // const result = await this.APILogModel.deleteMany({})
    // return !!result
    return await this.dataSource.query(`
    DELETE FROM public."APILogs"
    `)
  }

  async deleteAllDevicesTesting(): Promise<boolean> {
    // const result = await this.deviceModel.deleteMany({})
    // return !!result
    return await this.dataSource.query(`
    DELETE FROM public."Devices"
    `)
  }
}