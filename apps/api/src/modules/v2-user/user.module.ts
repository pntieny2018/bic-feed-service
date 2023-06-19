import { Module, Provider } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from './domain/repositoty-interface/user.repository.interface';
import { UserRepository } from './driven-adapter/repository/user.repository';
import { RedisModule } from '@app/redis';
import { USER_APPLICATION_TOKEN, UserApplicationService } from './application';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IAxiosConfig } from '../../config/axios';

const infrastructure: Provider[] = [
  {
    provide: USER_REPOSITORY_TOKEN,
    useClass: UserRepository,
  },
];

const application = [
  {
    provide: USER_APPLICATION_TOKEN,
    useClass: UserApplicationService,
  },
];

@Module({
  imports: [
    RedisModule,
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const axiosConfig = configService.get<IAxiosConfig>('axios');
        return {
          baseURL: axiosConfig.user.baseUrl,
          maxRedirects: axiosConfig.user.maxRedirects,
          timeout: axiosConfig.user.timeout,
        };
      },
    }),
  ],
  controllers: [],
  providers: [...infrastructure, ...application],
  exports: [USER_APPLICATION_TOKEN],
})
export class UserModuleV2 {}
