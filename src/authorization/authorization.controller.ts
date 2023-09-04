import { Body, Controller, Get, Headers, HttpCode, InternalServerErrorException, Ip, Post, Req, Res, UseGuards } from "@nestjs/common";
import { HttpStatusCode } from "../helpers/httpStatusCode";
import { AuthorizationService } from "./authorization.service";
import { Request, Response } from "express";
import { EmailConfirmationCodePipe } from "../validation/pipes/email-confirmation-code.pipe";
import { EmailValidation } from "../validation/Email";
import { NewPasswordInputModelValidation } from "../validation/newPasswordInputModel";
import { PasswordRecoveryCodeValidPipe } from "../validation/pipes/password-recovery-code-valid.pipe";
import { EmailOrLoginExistsPipe } from "../validation/pipes/email-login-exist.pipe";
import { LoginValidation } from "../validation/login";
import { LoginValidationPipe } from "../validation/pipes/login-validation.pipe";
import { AccessTokenVrifyModel } from "./models/input/Auth";
import { RefreshTokenGuard } from "../guards/refreshToken.guard";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { UserInputModel } from "../users/models/input/UserInput";
import { Roles } from "../decorators/roles.decorator";
import { UserRoles } from "../helpers/userRoles";
import { RolesGuard } from "../guards/roles.guard";

// @UseGuards(LogAPIThrottlerGuard)
//role
@UseGuards(RolesGuard)
@Roles(UserRoles.Guest)
@Controller('auth')
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService){}
  @Post('/login')
  async login(@Headers() headers, @Ip() ip, @Body(LoginValidationPipe) loginData: LoginValidation, @Res() res: Response) {
    const userId = await this.authorizationService.verifyUser(loginData)

    const userAgent = await headers['user-agent']
    const clientIP = await ip
    const tokens = await this.authorizationService.signIn(userId, userAgent, clientIP)

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
    })

    return res.status(HttpStatusCode.OK_200).send({accessToken: tokens.accessToken})
  }

  @UseGuards(RefreshTokenGuard)
  @Post('/refresh-token')
  async updateTokens(@Headers() headers, @Ip() ip, @Res() res: Response, @Req() req: Request) {
    const oldToken = await req.cookies.refreshToken
    const userAgent = await headers['user-agent']
    const clientIP = await ip
    const tokens = await this.authorizationService.updateDevice(oldToken, clientIP, userAgent)
    if(!tokens){
      throw new InternalServerErrorException()
    }

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
    })

    return res.status(HttpStatusCode.OK_200).send({accessToken: tokens.accessToken})
  }

  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Post('/logout')
  async logout(@Req() req: Request) {
    const oldToken = await req.cookies.refreshToken
    return await this.authorizationService.logoutDevice(oldToken)
  }

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Post('/registration')
  async createUser(@Body(EmailOrLoginExistsPipe) user: UserInputModel) {
    return await this.authorizationService.createUser(user)
  }

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Post('/registration-confirmation')//add code validation
  async registrationConfirmation(@Body(EmailConfirmationCodePipe) code: {code: string}) {
    return await this.authorizationService.confrmEmail(code.code)
  }

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Post('/registration-email-resending')//add code validation
  async registrationEmailResending(@Body(EmailConfirmationCodePipe) email: EmailValidation) {
    return await this.authorizationService.resendEmail(email.email)
  }

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Post('/password-recovery')//add code validation
  async passwordRecovery(@Body() email: EmailValidation) {
    return await this.authorizationService.recoverPassword(email.email)
  }

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Post('/new-password')//add code validation
  async newPassword(@Body(PasswordRecoveryCodeValidPipe) newPasswordAndCode: NewPasswordInputModelValidation) {
    //
    return await this.authorizationService.updatePassword(newPasswordAndCode.newPassword, newPasswordAndCode.recoveryCode)
  }

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  async getCurrentUser(@Req() req: AccessTokenVrifyModel) {
    ////////////
    return {
      email: req.user.email,
      login: req.user.login,
      userId: req.user.userId
    }
  }
}