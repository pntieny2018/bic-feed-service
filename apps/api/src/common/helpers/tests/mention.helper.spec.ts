import { MentionHelper } from '../mention.helper';

describe('MentionHelper', function () {
  describe('findMention', function () {
    it('when match', function () {
      const response = MentionHelper.findMention('xin chao @the.van');
      expect(response).toEqual(['the.van']);
    });
    it('when match is exclude', function () {
      const response = MentionHelper.findMention('xin chao @the.van', ['the.van']);
      expect(response).toEqual([]);
    });
    it('when not match', function () {
      const response = MentionHelper.findMention('xin chao', ['the.van']);
      expect(response).toEqual([]);
    });
  });
});
