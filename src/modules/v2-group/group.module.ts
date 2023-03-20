import { Module, Provider } from '@nestjs/common';
import { RedisModule } from '../../../libs/redis/src';
import { GroupApplicationService, GROUP_APPLICATION_TOKEN } from './application';
import { GROUP_REPOSITORY_TOKEN } from './domain/repositoty-interface/group.repository.interface';
import { GroupRepository } from './driven-adapter/repository/group.repository';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IAxiosConfig } from '../../config/axios';

const infrastructure: Provider[] = [
  {
    provide: GROUP_REPOSITORY_TOKEN,
    useClass: GroupRepository,
  },
];

const application = [
  {
    provide: GROUP_APPLICATION_TOKEN,
    useClass: GroupApplicationService,
  },
];

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const axiosConfig = configService.get<IAxiosConfig>('axios');
        return {
          baseURL: axiosConfig.baseUrl,
          maxRedirects: axiosConfig.maxRedirects,
          timeout: axiosConfig.timeout,
        };
      },
    }),
  ],
  controllers: [],
  providers: [...infrastructure, ...application],
  exports: [GROUP_APPLICATION_TOKEN],
})
export class GroupModuleV2 {}