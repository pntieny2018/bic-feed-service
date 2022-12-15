import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { RedisModule } from '@app/redis';
import { GroupHttpService } from './group-http.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IAxiosConfig } from '../../config/axios';

@Module({
  imports: [
    RedisModule,
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
  providers: [GroupService, GroupHttpService],
  exports: [GroupService, GroupHttpService],
})
export class GroupModule {}
