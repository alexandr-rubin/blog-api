import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TestingController } from './testing/testing.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BlogsController } from './blogs/blogs.controller';
import { JwtAuthService } from './domain/JWT.service';
import { BlogService } from './blogs/blog.service';
import { BlogQueryRepository } from './blogs/blog.query-repository';
import { BlogRepository } from './blogs/blog.repository';
import { BlogExistValidator } from './validation/BlogExistValidator';
//import { BlogIdForPostValidationPipe } from './validation/pipes/body-blog-id-validation.pipe';
import { CommentRepository } from './comments/comment.repository';
import { CommentService } from './comments/comment.service';
import { CommentQueryRepository } from './comments/comment.query-repository';
import { CommentExistValidator } from './validation/CommentExistValidator';
import { PostsController } from './posts/posts.controller';
import { PostService } from './posts/post.service';
import { PostQueryRepository } from './posts/post.query-repository';
import { PostRepository } from './posts/post.repository';
import { PostExistValidator } from './validation/PostExistValidator';
import { UsersController } from './users/super-admin.users.controller';
import { UserService } from './users/user.service';
import { UserQueryRepository } from './users/user.query-repository';
import { UserRepository } from './users/user.repository';
import { UserExistValidator } from './validation/UserExistValidator';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { EmailAdapter } from './authorization/adapters/email.adapter';
import { EmailService } from './authorization/email.service';
import { EmailConfirmationCodeValidator } from './validation/EmailConfirmationCodeValidator';
import { JwtModule } from '@nestjs/jwt';
import { Device, DeviceSchema } from './models/Device';
import { AuthorizationController } from './authorization/authorization.controller';
import { SecurityController } from './security/security.controller';
import { AuthorizationService } from './authorization/authorization.service';
import { SecurityService } from './security/security.service';
import { SecurityQueryRepository } from './security/security.query-repository';
import { AuthorizationRepository } from './authorization/authorization.repository';
import { SecurityRepository } from './security/security.repository';
import { LoginValidation } from './validation/login';
//import { AuthGuard } from './guards/auth.guard';
import { CommentController } from './comments/comments.controller';
import { IsBlogIdValidConstraint } from './decorators/isBlogIdValid';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Comment, CommentSchema } from './comments/models/schemas/Comment';
import { Blog, BlogSchema } from './blogs/models/schemas/Blog';
import { Post, PostSchema } from './posts/models/schemas/Post';
import { APILog, APILogSchema } from './security/models/schemas/APILogs';
import { getConfiguration } from './config/configuration';
import { User, UserSchema } from './users/models/schemas/User';
import { PublicBlogsController } from './blogs/public.bogs.controller';
import { SuperAdminBlogsController } from './blogs/super-admin.blogs.controller';
import { RolesGuard } from './guards/roles.guard';
import { CqrsModule } from '@nestjs/cqrs';
import { UpdatePostLikeStatusUseCase } from './posts/use-cases/update-post-like-staus-use-case';
import { BloggerBlogsUsersController } from './blogs/blogs-users.controller';
import { BlogBannedUsers, BlogBannedUsersSchema } from './blogs/models/schemas/BlogBannedUsers';
import { UpdateCommentLikeStatusUseCase } from './comments/use-cases/update-comment-like-use-case';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './users/entities/user.entity';
import { APILogEntity } from './security/ALILogs.entity';
import { BlogEntity } from './blogs/entities/blog.entity';
import { BlogBannedUsersEntity } from './blogs/entities/blog-banned-users.entity';
import { PostEntity } from './posts/entities/post.entity';
import { PostLikesAndDislikesEntity } from './posts/entities/post-likes-and-dislikes.entity';
import { CommentEntity } from './comments/entities/comment.entity';
import { CommentLikesAndDislikesEntity } from './comments/entities/comment-likes-and-dislikes';
import { DeviceEntity } from './models/device.entity';
import { QuizQuestionsController } from './quiz/quiz-questions/quiz-questions.controller';
import { QuizQuestionEntity } from './quiz/quiz-questions/entities/quiz-question.entity';
import { QuizQuestionsQueryRepository } from './quiz/quiz-questions/quiz-questions.query-repository';
import { QuestionExistValidator } from './validation/QuestionExistValidator';
import { QuizQuestionsRepository } from './quiz/quiz-questions/quiz-questions.repository';
import { QuizQuestionsService } from './quiz/quiz-questions/quiz-questions.service';
import { QuizGameEntity } from './quiz/pair-quiz-game/entities/quiz-game.entity';
import { QuizGamesRepository } from './quiz/pair-quiz-game/quiz-games.repository';
import { QuizGamesService } from './quiz/pair-quiz-game/quiz-games.service';
import { QuizGamesController } from './quiz/pair-quiz-game/quiz-games.controller';
import { QuizGamesQueryRepository } from './quiz/pair-quiz-game/quiz-games.query-repository';
import { QuizGameExistValidator } from './validation/GameExistValidator';
import { QuizAnswersEntity } from './quiz/pair-quiz-game/entities/quiz-answers.entity';
import { AnswerCurrentGameQuestionUseCase } from './quiz/pair-quiz-game/use-cases/answer-current-game-question-use-case';
import { CreateOrConnectToTheGameUseCase } from './quiz/pair-quiz-game/use-cases/create-or-connect-to-the-game-use-case';
import { ScheduleModule } from '@nestjs/schedule';
import { GameTimestampsEntity } from './quiz/pair-quiz-game/entities/game-last-answer-timestamp';

@Module({
  imports: [
    CqrsModule,
    //UsersModule,
    //PostsModule,
    //BlogsModule,
    //CommentsModule,
    //EmailModule,
    //AuthModule,
    ConfigModule.forRoot({
      load: [getConfiguration]
    }),
    ThrottlerModule.forRoot({
      ttl: 10,
      limit: 5,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'swagger-static'),
      serveRoot: process.env.NODE_ENV === 'development' ? '/' : '/swagger',
    }),
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: 'rubinyourhead@gmail.com',
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: 'homework <rubinyourhead@gmail.com>',
      },
      template: {
        dir: __dirname + '/../templates',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    JwtModule.register({
      global: true,
      // через конфиг когда добавлю отдельный модуль 
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '10m' },
    }),

    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('db.postgres.host'),
        port: configService.get<number>('db.postgres.port'),
        username: configService.get<string>('db.postgres.username'),
        password: configService.get<string>('db.postgres.password'),
        database: configService.get<string>('db.postgres.database'),
        autoLoadEntities: true,
        synchronize: false,
      }),
      inject: [ConfigService],
    }),

    // TypeOrmModule.forRoot({
    //   type: 'postgres',
    //   host: 'localhost',
    //   port: 5432,
    //   username: 'postgres',
    //   password: 'admin',
    //   database: 'incubatorTypeormAuto',
    //   autoLoadEntities: true,
    //   synchronize: true,
    // }),

    TypeOrmModule.forFeature([UserEntity, 
      APILogEntity, 
      DeviceEntity, 
      BlogEntity, 
      BlogBannedUsersEntity, 
      PostEntity, 
      PostLikesAndDislikesEntity, 
      CommentEntity,
      CommentLikesAndDislikesEntity,
      QuizQuestionEntity,
      QuizGameEntity,
      QuizAnswersEntity,
      GameTimestampsEntity
    ]),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('db.mongo.mongodb_uri'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Blog.name, schema: BlogSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: User.name, schema: UserSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: APILog.name, schema: APILogSchema },
      { name: BlogBannedUsers.name, schema: BlogBannedUsersSchema }
    ]),
  ],
  controllers: [AppController, TestingController, BlogsController, PostsController, UsersController, CommentController, AuthorizationController, SecurityController,
    PublicBlogsController, SuperAdminBlogsController, BloggerBlogsUsersController, QuizQuestionsController, QuizGamesController],
  providers: [AppService, IsBlogIdValidConstraint, JwtStrategy, JwtAuthGuard,
    JwtAuthService, RolesGuard,
    BlogService, BlogQueryRepository, BlogRepository, BlogExistValidator,
    CommentService, CommentQueryRepository, CommentRepository, CommentExistValidator, UpdateCommentLikeStatusUseCase,
    PostService, PostQueryRepository, PostRepository, PostExistValidator, UpdatePostLikeStatusUseCase,
    UserService, UserQueryRepository, UserRepository, UserExistValidator,
    EmailAdapter, EmailService, EmailConfirmationCodeValidator,
    AuthorizationService, AuthorizationRepository,
    LoginValidation, SecurityService, SecurityRepository, SecurityQueryRepository,
    QuizQuestionsService, QuizQuestionsRepository, QuizQuestionsQueryRepository, QuestionExistValidator,
    QuizGamesService, QuizGamesRepository, QuizGamesQueryRepository, QuizGameExistValidator, AnswerCurrentGameQuestionUseCase, CreateOrConnectToTheGameUseCase],
})

export class AppModule {}
