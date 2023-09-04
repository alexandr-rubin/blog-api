import { INestApplication, ValidationPipe } from "@nestjs/common"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { useContainer } from "class-validator"
import cookieParser from "cookie-parser"
import { AppModule } from "./app.module"
import { validationExceptionFactory } from "./validation/Factories/custom-exception-factory"
import { HttpExceptionFilter } from "./validation/filters/exception.filter"

export const appSettings = (app: INestApplication) => {
  app.use(cookieParser())
  useContainer(app.select(AppModule), { fallbackOnErrors: true })
  
  app.enableCors()

  const config = new DocumentBuilder()
    .setTitle('Product example')
    .setDescription('The API description')
    .setVersion('1.0')
    .addTag('Product')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    stopAtFirstError: true,
    exceptionFactory: validationExceptionFactory
  }))
  app.useGlobalFilters(new HttpExceptionFilter())
}