import { Remarkable } from 'remarkable';
import { Node } from 'slate';
export class StringHelper {
  /**
   * Convert camel case string to snake case string
   * @param str Camel case string
   * @param whiteList
   * @returns Snake case string
   */
  public static camelToSnakeCase(str: string, whiteList?: string[]): string {
    let snakeCaseStr = str.replace(/[A-Z]/g, (letter) => {
      return `_${letter.toLowerCase()}`;
    });
    if ((whiteList ?? []).length) {
      whiteList.forEach((w) => {
        snakeCaseStr = snakeCaseStr.replace(StringHelper.camelToSnakeCase(w), w);
      });
    }
    return snakeCaseStr;
  }

  /**
   * Convert snake case string to camel case string
   * @param str Snake case string
   * @returns Camel case string
   */
  public static snakeToCamelCase(str: string): string {
    return str.replace(/([-_][a-z])/gi, ($1) => {
      return $1.toUpperCase().replace('-', '').replace('_', '');
    });
  }

  /**
   * Parse cookie string to cookie object
   * @param cookieStr String cookie
   * @returns Cookie object
   */
  public static parseCookieStr(cookieStr: string): Record<string, string> {
    try {
      return cookieStr.split('; ').reduce((prev, current) => {
        const [name, ...value] = current.split('=');
        prev[name] = value.join('=');
        return prev;
      }, {});
    } catch (e) {
      return {};
    }
  }

  /**
   * Check is Json type
   * @param str String
   * @returns Is Json type
   */
  public static isJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get string random
   * @param length: Number
   * @returns String random
   */
  public static randomStr(length: number): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  public static convertToSlug(str: string): string {
    return str
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  }

  public static isASCII(str: string): boolean {
    return /^[\x00-\x7F]*$/.test(str);
  }

  public static removeMarkdownCharacter(str: string): string {
    try {
      const stringConverted = str
        //.replace(/^\s{1,2}\[(.*?)\]: (\S+)( ".*?")?\s*$/g, '')// Remove reference-style links?
        .replace(/([\*]+)(\S)(.*?\S)??\1/g, '$2$3') // Remove **
        .replace(/([\+]+)(\S)(.*?\S)??\1/g, '$2$3') // Remove ++
        .replace(/(^|\W)([_]+)(\S)(.*?\S)??\2($|\W)/g, '$1$3$4$5') //remove _
        .replace(/~(.*?)~/g, '$1'); //remove ~~
      return stringConverted;
    } catch (e) {
      return str;
    }
  }

  public static parsePaginationCursor(cursor: string): [string, 'ASC' | 'DESC'] {
    if (!cursor) {
      return null;
    }

    try {
      return JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
    } catch (e) {
      return null;
    }
  }

  public static serializeEditorContentToText(textStringify: string): string {
    if (!textStringify) {
      return textStringify;
    }
    try {
      const nodes: Node[] = JSON.parse(textStringify);
      return nodes.map((node) => Node.string(node)).join('\n');
    } catch (e) {
      return null;
    }
  }

  public static containsOnlySpace(str: string): boolean {
    return str.trim().length === 0;
  }

  public static createRemarkableParser() {
    const mdParser = new Remarkable({
      html: false, // Disable HTML tags in source
      breaks: true, // convert `/n` to `<br />`
      linkTarget: '_blank', // Add target="_blank" to links
    });
    mdParser.inline.ruler.enable([
      'ins', // md.render('++underline++') // => '<p><ins>underline</ins></p>'
      'mark', // md.render('==marked==') // => '<p><mark>marked</mark></p>'
    ]);

    return mdParser;
  }

  public static getRawTextFromMarkdown(content?: string | null): string {
    let result = '';
    if (!content) {
      return result;
    }

    const remarkableParser = this.createRemarkableParser();

    try {
      const elements = remarkableParser.parse(content || '', {});
      for (let i = 0; i < elements.length; i += 1) {
        // Guard against content not available to extract
        const token = elements[i];
        if (token?.type !== 'inline') {
          continue;
        }
        const childToken = token.children;
        if (!childToken) {
          continue;
        }
        // Get text blocks from child tokens
        const rawTextFromMarkdown = childToken
          .map((child) => {
            if (child.type === 'text') {
              return child.content;
            }
            if (child.type === 'softbreak') {
              return '\n';
            }
            if (child.type === 'hardbreak') {
              return '\n';
            }
            return '';
          })
          .join('');
        result += rawTextFromMarkdown;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('🚀 ~ getRawTextFromMarkdown:', error);
    }

    return result;
  }

  public static isString(value: any): boolean {
    return typeof value === 'string';
  }
}
