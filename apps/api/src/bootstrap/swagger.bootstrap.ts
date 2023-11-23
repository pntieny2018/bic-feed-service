import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ISwaggerConfig } from '@libs/common/config/swagger';

export class SwaggerBootstrap {
  /**
   * Initializers the SwaggerBootstrap.
   * @param app Reference instance of INestApplication.
   * @param configService Reference instance of ConfigService.
   * @return void
   */
  public static init(app: INestApplication, configService: ConfigService): void {
    const swaggerConfig = configService.get<ISwaggerConfig>('swagger');
    if (swaggerConfig.enable) {
      const options = new DocumentBuilder()
        .setTitle(swaggerConfig.title)
        .setDescription(swaggerConfig.description)
        .setVersion(swaggerConfig.version)
        .addServer(swaggerConfig.apiBasePath)
        .addSecurity('authorization', {
          type: 'apiKey',
          in: 'header',
          name: 'authorization',
        })
        .build();
      const document = SwaggerModule.createDocument(app, options);

      SwaggerModule.setup(swaggerConfig.path, app, document, {
        swaggerOptions: {
          persistAuthorization: true,
        },
      });
      Logger.debug('Swagger initialized', SwaggerBootstrap.name);
    }
  }
}
