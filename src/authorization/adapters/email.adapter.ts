import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailAdapter {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(email: string, subject: string, html: string) {
    try {
      await this.mailerService
      .sendMail({
        to: email,
        from: 'rubinyourhead@gmail.com',
        subject: subject,
        text: 'welcome',
        // const
        html: html,
      })

      console.log("Message sent");
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  
}
