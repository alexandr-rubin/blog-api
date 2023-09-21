import { Injectable } from "@nestjs/common";
import { Device } from "../models/Device";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, UpdateResult } from "typeorm";
import { DeviceEntity } from "../models/device.entity";

@Injectable()
export class AuthorizationRepository {
  constructor(@InjectRepository(DeviceEntity) private readonly deviceRepository: Repository<DeviceEntity>){}
  
  async logoutDevice(deviceId: string): Promise<UpdateResult> {
    //
    // const isUpdated = await this.deviceModel.findOneAndUpdate({deviceId: deviceId}, {isValid: false})
    // return isUpdated.toJSON()

    // return await this.dataSource.query(`
    // UPDATE public."Devices"
    // SET
    //   "isValid" = $1
    // WHERE "deviceId" = $2`,
    // [
    //   false,
    //   deviceId
    // ]);

  return await this.deviceRepository
    .createQueryBuilder()
    .update(DeviceEntity)
    .set({ isValid: false })
    .where({ deviceId: deviceId })
    .execute();
  }
  async updateDevice(device: Device) {
    //
    // const isUpdated = await this.deviceModel.findOneAndUpdate(device)
    // return isUpdated.toJSON()
    // return await this.dataSource.query(`
    // UPDATE public."Devices"
    // SET
    //   "issuedAt" = $1,
    //   "expirationDate" = $2,
    //   "IP" = $3,
    //   "deviceName" = $4,
    //   "deviceId" = $5,
    //   "userId" = $6,
    //   "isValid" = $7
    // WHERE "deviceId" = $5`,
    // [
    //   device.issuedAt,
    //   device.expirationDate,
    //   device.IP,
    //   device.deviceName,
    //   device.deviceId,
    //   device.userId,
    //   device.isValid,
    // ]);
    return await this.deviceRepository
      .createQueryBuilder()
      .update(DeviceEntity)
      .set({
        issuedAt: device.issuedAt,
        expirationDate: device.expirationDate,
        IP: device.IP,
        deviceName: device.deviceName,
        deviceId: device.deviceId,
        userId: device.userId,
        isValid: device.isValid,
      })
      .where({ deviceId: device.deviceId })
      .execute();

  }
  async addDevice(device: Device): Promise<DeviceEntity> {
    // const newDdevice = new this.deviceModel(device)
    // const save = await newDdevice.save()
    // return save.toJSON()
    // return await this.dataSource.query(`
    // INSERT INTO public."Devices"(
    //   id, "issuedAt", "expirationDate", "IP", "deviceName", "deviceId", "userId", "isValid")
    //   VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7)`,
    // [
    //   device.issuedAt,
    //   device.expirationDate,
    //   device.IP,
    //   device.deviceName,
    //   device.deviceId,
    //   device.userId,
    //   device.isValid
    // ]);
    return await this.deviceRepository.save(device)
  }
}