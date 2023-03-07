import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { Language, LANGUAGE_HEADER } from '../../common/constants';
import * as path from 'path';
@Global()
@Module({
  imports: [
    I18nModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        const defaultLang = configService.get('lang');
        return {
          fallbackLanguage: defaultLang || Language.en,
          loaderOptions: {
            path: path.join(__dirname, '../../i18n/'),
          },
        };
      },
      resolvers: [new HeaderResolver([LANGUAGE_HEADER])],
      inject: [ConfigService],
    }),
  ],
  exports: [I18nModule],
})
export class I18nGlobalModule {}
