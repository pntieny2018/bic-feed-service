import { Module, Provider } from '@nestjs/common';
import { GROUP_APPLICATION_TOKEN, GroupApplicationService } from './application';
import { GROUP_REPOSITORY_TOKEN } from './domain/repositoty-interface/group.repository.interface';
import { GroupRepository } from './driven-adapter/repository/group.repository';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IAxiosConfig } from '@libs/infra/http';

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
          baseURL: axiosConfig.group.baseUrl,
          maxRedirects: axiosConfig.group.maxRedirects,
          timeout: axiosConfig.group.timeout,
        };
      },
    }),
  ],
  controllers: [],
  providers: [...infrastructure, ...application],
  exports: [GROUP_APPLICATION_TOKEN],
})
export class GroupModuleV2 {}
