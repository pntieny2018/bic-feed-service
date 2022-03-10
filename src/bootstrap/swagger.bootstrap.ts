import { ConfigService } from '@nestjs/config';
import { ISwaggerConfig } from '../config/swagger';
import { INestApplication, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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
      Logger.log('Swagger initialized', SwaggerBootstrap.name);
    }
  }
}
