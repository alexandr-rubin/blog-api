import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Device } from "../models/Device";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { DeviceEntity } from "../models/device.entity";

@Injectable()
export class SecurityQueryRepository {
  constructor(private jwtService: JwtService, @InjectDataSource() protected dataSource: DataSource,
  @InjectRepository(DeviceEntity) private readonly deviceRepository: Repository<DeviceEntity>){}

  async getActiveDevices(token: string) {
    //valid?
    const userId = (await this.jwtService.verify(token)).userId
    // const devices = await this.deviceModel.find({userId: userId, isValid: true}).lean()
    // const devices = await this.dataSource.query(`SELECT * FROM public."Devices" 
    //   WHERE "userId" = $1 AND "isValid" = $2`, [userId, true])
    const devices = await this.deviceRepository.findBy({userId: userId, isValid: true})
    const result = devices.map(device => {return {deviceId: device.deviceId, ip: device.IP, lastActiveDate: device.issuedAt, title: device.deviceName}})
    return result
  }

  async getDeviceByToken(token: string): Promise<Device | null>{
    try {
      const decodedToken = await this.jwtService.verifyAsync(token)
      // const device = await this.deviceModel.findOne({deviceId: decodedToken.deviceId})
      // const device = await this.dataSource.query(`SELECT * FROM public."Devices" 
      // WHERE "deviceId" = $1`, [decodedToken.deviceId])
      
      // return device[0]
      const device = await this.deviceRepository.findOneBy({ deviceId: decodedToken.deviceId })
      return device
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