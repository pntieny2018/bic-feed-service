import { HttpService, IHttpDALModuleOptions, IHttpService } from '@libs/infra/http';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
})
export class HttpModule {
  public static forRoot(options: IHttpDALModuleOptions[]): DynamicModule {
    return {
      module: HttpModule,
      providers: [...this._createHttpOptionsProvider(options)],
      exports: [...options.map((option) => option.provide)],
    };
  }

  private static _createHttpOptionsProvider(options: IHttpDALModuleOptions[]): Provider[] {
    return options.map((option) => ({
      provide: option.provide,
      useFactory: (configs: ConfigService): IHttpService => {
        return new HttpService(option.useFactory(configs));
      },
      inject: option.inject || [],
    }));
  }
}
