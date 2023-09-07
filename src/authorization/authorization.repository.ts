import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Device, DeviceDocument } from "../models/Device";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class AuthorizationRepository {
  constructor(@InjectModel(Device.name) private deviceModel: Model<DeviceDocument>, @InjectDataSource() protected dataSource: DataSource){}
  
  async logoutDevice(deviceId: string) {
    //
    // const isUpdated = await this.deviceModel.findOneAndUpdate({deviceId: deviceId}, {isValid: false})
    // return isUpdated.toJSON()

    return await this.dataSource.query(`
    UPDATE public."Devices"
    SET
      "isValid" = $1
    WHERE "deviceId" = $2`,
    [
      false,
      deviceId
    ]);
  }
  async updateDevice(device: Device) {
    //
    // const isUpdated = await this.deviceModel.findOneAndUpdate(device)
    // return isUpdated.toJSON()
    return await this.dataSource.query(`
    UPDATE public."Devices"
    SET
      "issuedAt" = $1,
      "expirationDate" = $2,
      "IP" = $3,
      "deviceName" = $4,
      "deviceId" = $5,
      "userId" = $6,
      "isValid" = $7
    WHERE "deviceId" = $5`,
    [
      device.issuedAt,
      device.expirationDate,
      device.IP,
      device.deviceName,
      device.deviceId,
      device.userId,
      device.isValid,
    ]);

  }
  async addDevice(device: Device){
    // const newDdevice = new this.deviceModel(device)
    // const save = await newDdevice.save()
    // return save.toJSON()
    return await this.dataSource.query(`
    INSERT INTO public."Devices"(
      id, "issuedAt", "expirationDate", "IP", "deviceName", "deviceId", "userId", "isValid")
      VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7)`,
    [
      device.issuedAt,
      device.expirationDate,
      device.IP,
      device.deviceName,
      device.deviceId,
      device.userId,
      device.isValid
    ]);
  }
}