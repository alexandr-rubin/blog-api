import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DeviceDocument = HydratedDocument<Device>;

@Schema()
export class Device {
  @Prop()
  issuedAt!: string
  @Prop()
  expirationDate!: string
  @Prop()
  IP!: string
  @Prop()
  deviceName!: string
  @Prop()
  deviceId!: string
  @Prop()
  userId!: string
  @Prop()
  isValid!: boolean
}

export const DeviceSchema = SchemaFactory.createForClass(Device)