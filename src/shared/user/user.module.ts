import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { RedisModule } from '@app/redis';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IAxiosConfig } from '../../config/axios';
import { UserHttpService } from './user-http.service';

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
  providers: [UserService, UserHttpService],
  exports: [UserService, UserHttpService],
})
export class UserModule {}
