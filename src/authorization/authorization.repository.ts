import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Device, DeviceDocument } from "../models/Device";

@Injectable()
export class AuthorizationRepository {
  constructor(@InjectModel(Device.name) private deviceModel: Model<DeviceDocument>){}
  
  async logoutDevice(deviceId: string) {
    //
    const isUpdated = await this.deviceModel.findOneAndUpdate({deviceId: deviceId}, {isValid: false})
    return isUpdated.toJSON()
  }
  async updateDevice(device: Device) {
    //
    const isUpdated = await this.deviceModel.findOneAndUpdate(device)
    return isUpdated.toJSON()
  }
  async addDevice(device: Device){
    const newDdevice = new this.deviceModel(device)
    const save = await newDdevice.save()
    return save.toJSON()
  }
}