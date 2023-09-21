import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { APILog } from "./models/schemas/APILogs";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, MoreThanOrEqual, Not, Repository, UpdateResult } from "typeorm";
import { DeviceEntity } from "../models/device.entity";
import { APILogEntity } from "./ALILogs.entity";

@Injectable()
export class SecurityRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource, @InjectRepository(DeviceEntity) private readonly deviceRepository: Repository<DeviceEntity>,
  @InjectRepository(APILogEntity) private readonly apiLogRepository: Repository<APILogEntity>) {}

  async terminateAllDeviceSessions(userId: string, deviceId: string): Promise<UpdateResult> {
    // const isTerminated = (await this.deviceModel.deleteMany({userId: userId, deviceId: {$ne: deviceId}})).acknowledged
    // return isTerminated
    // return await this.dataSource.query(`
    // DELETE FROM public."Devices"
    // WHERE "userId" = $1 AND "deviceId" != $2`,
    // [userId, deviceId]);
    return await this.deviceRepository.update(
      { userId: userId, deviceId: Not(deviceId) },
      { isValid: false }
    )
  }

  async terminateSpecifiedDeviceSessions(deviceId: string, userId: string):  Promise<UpdateResult> {
    // возвращать объект как в комментах
    //const device = await this.deviceModel.findOne({deviceId: deviceId})
    // const device = (await this.dataSource.query(`SELECT * FROM public."Devices" 
    //   WHERE "deviceId" = $1`, [deviceId]))[0]
    // if(!device){
    //   throw new NotFoundException()
    // }
    // if(device.userId !== userId) {
    //   throw new ForbiddenException()
    // }
    // // const isTerminated = (await this.deviceModel.deleteOne({deviceId: deviceId})).acknowledged
    // // return isTerminated
    // return await this.dataSource.query(`
    // DELETE FROM public."Devices"
    // WHERE "deviceId" = $1`,
    // [deviceId]);
    const device = await this.deviceRepository.findOneBy({ deviceId: deviceId })

    if(!device){
      throw new NotFoundException()
    }
    if(device.userId !== userId) {
      throw new ForbiddenException()
    }

    return await this.deviceRepository.update({ deviceId: deviceId }, { isValid: false })
  }

  async terminateBannedUserSessions(userId: string): Promise<boolean> {
    // const isTerminated = (await this.deviceModel.deleteMany({userId: userId})).acknowledged
    // return isTerminated
    return true
  }

  async addLog(logEntry: APILog): Promise<APILog> {
    // const newAPILog = new this.APILogModel(logEntry)
    // const save = await newAPILog.save()
    // return save
    // return await this.dataSource.query(`INSERT INTO public."APILogs"(
    //   id, "IP", "URL", date)
    //   VALUES (uuid_generate_v4(), $1, $2, $3)`, [logEntry.IP, logEntry.URL, logEntry.date])
    return await this.apiLogRepository.save(logEntry)
  }

  async countDoc(filter:any): Promise<number> {
    // const count = await this.APILogModel.countDocuments(filter)
    // return count
    // const result = await this.dataSource.query(`
    // SELECT COUNT(*)
    // FROM public."APILogs"
    // WHERE "IP" = $1
    //   AND "URL" = $2
    //   AND "date" >= $3
    // `, [
    //   filter.IP,
    //   filter.URL,
    //   filter.date.$gte,
    // ])

    // return result[0].count
    const { IP, URL, date } = filter;
      const count = await this.apiLogRepository.count({
        where: {
          IP,
          URL,
          date: MoreThanOrEqual(date),
        },
      })
    
    return count
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