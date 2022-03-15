export class MentionHelper {
  public static findMention(content: string, exclude: string[] = ['']): string[] {
    content = content ?? '';
    const regex = /(^|[^\w])@([\w]+)/g;
    let match;
    const mentions: string[] = [];
    while ((match = regex.exec(content))) {
      if (!exclude.includes(match[2])) {
        mentions.push(match[2]);
      }
    }
    return mentions;
  }
}
