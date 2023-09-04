// import { Module } from '@nestjs/common';
// import { MailerModule } from '@nestjs-modules/mailer';
// import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
// import { EmailAdapter } from '../adapters/email.adapter';
// import { EmailService } from '../domain/email.service';
// import { EmailConfirmationCodeValidator } from '../validation/EmailConfirmationCodeValidator';
// import { EmailConfirmationCodePipe } from '../validation/pipes/email-confirmation-code.pipe';
// import { EmailOrLoginExistsPipe } from '../validation/pipes/email-login-exist.pipe';
// import { UsersModule } from './users.module';
// import { BasicAuthGuard } from '../guards/basic-auth.guard';

// @Module({
//   imports: [
//     UsersModule,
//     MailerModule.forRoot({
//       transport: {
//         service: 'gmail',
//         auth: {
//           user: 'rubinyourhead@gmail.com',
//           pass: 'kixbxpkqgkdbabte',
//         },
//       },
//       defaults: {
//         from: 'homework <rubinyourhead@gmail.com>',
//       },
//       template: {
//         dir: __dirname + '/../templates',
//         adapter: new HandlebarsAdapter(),
//         options: {
//           strict: true,
//         },
//       },
//     }),
//   ],
//   providers: [EmailAdapter, EmailService, EmailConfirmationCodeValidator, EmailConfirmationCodePipe, EmailOrLoginExistsPipe, BasicAuthGuard],
//   exports: [EmailAdapter, EmailService, EmailConfirmationCodeValidator, EmailConfirmationCodePipe, EmailOrLoginExistsPipe, MailerModule],
// })
// export class EmailModule {}
