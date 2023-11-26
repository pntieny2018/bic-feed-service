import { PostLang } from '../../modules/v2-post/data-type';
import { getElasticsearchConfig } from '@libs/common/config/elasticsearch';

export class ElasticsearchHelper {
  private static _prefix = getElasticsearchConfig().namespace + '_';
  public static LANGUAGES_SUPPORTED = ['vi', 'en', 'es', 'ru', 'ja', 'zh', 'ko'];
  public static ALIAS = {
    POST: {
      all: {
        lang: 'all',
        name: this._prefix + 'posts*',
      },
      default: {
        lang: 'default',
        name: this._prefix + 'posts',
      },
      vi: {
        lang: 'vi',
        name: this._prefix + 'posts_vi',
      },
      en: {
        lang: 'en',
        name: this._prefix + 'posts_en',
      },
      ru: {
        lang: 'ru',
        name: this._prefix + 'posts_ru',
      },
      es: {
        lang: 'es',
        name: this._prefix + 'posts_es',
      },
      ko: {
        lang: 'ko',
        name: this._prefix + 'posts_ko',
      },
      ja: {
        lang: 'ja',
        name: this._prefix + 'posts_ja',
      },
      zh: {
        lang: 'zh',
        name: this._prefix + 'posts_zh',
      },
    },
    ARTICLE: {
      all: {
        lang: 'all',
        name: this._prefix + 'articles*',
      },
      default: {
        lang: 'default',
        name: this._prefix + 'articles',
      },
      vi: {
        lang: 'vi',
        name: this._prefix + 'articles_vi',
      },
      en: {
        lang: 'en',
        name: this._prefix + 'articles_en',
      },
      ru: {
        lang: 'ru',
        name: this._prefix + 'articles_ru',
      },
      es: {
        lang: 'es',
        name: this._prefix + 'articles_es',
      },
      ko: {
        lang: 'ko',
        name: this._prefix + 'articles_ko',
      },
      ja: {
        lang: 'ja',
        name: this._prefix + 'articles_ja',
      },
      zh: {
        lang: 'zh',
        name: this._prefix + 'articles_zh',
      },
    },
  };

  public static PIPE_LANG_IDENT = {
    POST: 'pipe_lang_ident_post',
  };

  public static getLangOfPostByIndexName(indexName: string, defaultIndex?: string): PostLang {
    const index = defaultIndex ? defaultIndex : this.ALIAS.POST.default.name;
    const lang = indexName.slice(index.length + 1, index.length + 3);

    return this.LANGUAGES_SUPPORTED.includes(lang) ? (lang as PostLang) : null;
  }
  public static getIndexOfPostByLang(lang: string): string {
    if (!lang) {
      return this.ALIAS.POST.default.name;
    }
    const indexName = this.ALIAS.POST.default.name + '_' + lang;
    return indexName;
  }

  public static getLangOfArticleByIndexName(indexName: string): string {
    const lang = indexName.slice(
      this.ALIAS.ARTICLE.default.name.length + 1,
      this.ALIAS.ARTICLE.default.name.length + 3
    );

    return lang;
  }
  public static getIndexOfArticleByLang(lang: string): string {
    const indexName = this.ALIAS.ARTICLE.default.name + '_' + lang;
    return indexName;
  }
}
