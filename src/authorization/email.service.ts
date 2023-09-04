import { Injectable } from '@nestjs/common';
import { EmailAdapter } from './adapters/email.adapter';

@Injectable()
export class EmailService {
  constructor(private readonly emailAdapter: EmailAdapter) {}
  async sendRegistrationConfirmationEmail(email: string, code: string){
    //const
    const html = `<a href='https://incubator-homework-nest.vercel.app/confirm-email?code=${code}'>complete registration</a>` 
    const subject = 'registration'
    return await this.emailAdapter.sendEmail(email, subject, html)
  } 

  async sendPasswordRecoverEmail(email: string, code: string){
    //const
    const html = `<a href='https://incubator-homework-nest.vercel.app/password-recovery?recoveryCode=${code}'>recovery password</a>`
    const subject = 'password recovery'
    return await this.emailAdapter.sendEmail(email, subject, html)
  }
}
