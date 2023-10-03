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
    return await this.deviceRepository.update(
      { userId: userId, deviceId: Not(deviceId) },
      { isValid: false }
    )
  }

  async terminateSpecifiedDeviceSessions(deviceId: string, userId: string):  Promise<UpdateResult> {
    // возвращать объект как в комментах
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
    return await this.apiLogRepository.save(logEntry)
  }

  async countDoc(filter:any): Promise<number> {
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
    return await this.dataSource.query(`
    DELETE FROM public."APILogs"
    `)
  }

  async deleteAllDevicesTesting(): Promise<boolean> {
    return await this.dataSource.query(`
    DELETE FROM public."Devices"
    `)
  }
}