import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Device, DeviceDocument } from "../models/Device";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class SecurityQueryRepository {
  constructor(@InjectModel(Device.name) private deviceModel: Model<DeviceDocument>, private jwtService: JwtService, @InjectDataSource() protected dataSource: DataSource){}

  async getActiveDevices(token: string) {
    //valid?
    const userId = (await this.jwtService.verify(token)).userId
    // const devices = await this.deviceModel.find({userId: userId, isValid: true}).lean()
    const devices = await this.dataSource.query(`SELECT * FROM public."Devices" 
      WHERE "userId" = $1 AND "isValid" = $2`, [userId, true])
    const result = devices.map(device => {return {deviceId: device.deviceId, ip: device.IP, lastActiveDate: device.issuedAt, title: device.deviceName}})
    return result
  }

  async getDeviceByToken(token: string): Promise<Device | null>{
    try {
      const decodedToken = await this.jwtService.verifyAsync(token)
      // const device = await this.deviceModel.findOne({deviceId: decodedToken.deviceId})
      const device = await this.dataSource.query(`SELECT * FROM public."Devices" 
      WHERE "deviceId" = $1`, [decodedToken.deviceId])
      
      return device[0]
    }
    catch(err) {
      return null
    }
  }

  /////////////////////////
  async compareTokenDate(token: string): Promise<boolean>{
    try{
      const decodedToken = await this.jwtService.verifyAsync(token)
      const device = await this.getDeviceByToken(token)
      if(!device || decodedToken.issuedAt !== device.issuedAt){
        return false
      }
      return true
    }
    catch(err) {
      return false
    }
}
}