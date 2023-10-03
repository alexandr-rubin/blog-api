import { Injectable } from "@nestjs/common";
import { Device } from "../models/Device";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, UpdateResult } from "typeorm";
import { DeviceEntity } from "../models/device.entity";

@Injectable()
export class AuthorizationRepository {
  constructor(@InjectRepository(DeviceEntity) private readonly deviceRepository: Repository<DeviceEntity>){}
  
  async logoutDevice(deviceId: string): Promise<UpdateResult> {
  return await this.deviceRepository
    .createQueryBuilder()
    .update(DeviceEntity)
    .set({ isValid: false })
    .where({ deviceId: deviceId })
    .execute();
  }
  async updateDevice(device: Device) {
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
    return await this.deviceRepository.save(device)
  }
}