import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { HydratedDocument } from "mongoose";

export type APILogDocument = HydratedDocument<APILog>;

@Schema()   
export class APILog {
    @Prop()
    IP!: string
    @Prop()
    URL!: string
    @Prop()
    date!: string
}

export const APILogSchema = SchemaFactory.createForClass(APILog)