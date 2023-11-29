export const POST_JA_MAPPING = {
  settings: {
    analysis: {
      analyzer: {
        ma_kuromoji: {
          filter: [
            'kuromoji_baseform',
            'kuromoji_part_of_speech',
            'cjk_width',
            'ja_stop',
            'kuromoji_stemmer',
            'lowercase',
          ],
          char_filter: ['html_strip', 'icu_normalizer'],
          tokenizer: 'kuromoji_tokenizer',
        },
      },
    },
  },
  mappings: {
    properties: {
      groupIds: {
        type: 'keyword',
      },
      communityIds: {
        type: 'keyword',
      },
      categories: {
        properties: {
          id: {
            type: 'keyword',
          },
          name: {
            type: 'text',
            index: false,
          },
        },
      },
      seriesIds: {
        type: 'keyword',
      },
      itemIds: {
        type: 'keyword',
      },
      tags: {
        properties: {
          id: {
            type: 'keyword',
          },
          groupId: {
            type: 'keyword',
          },
          name: {
            type: 'keyword',
          },
        },
      },
      content: {
        type: 'text',
        term_vector: 'with_positions_offsets',
        fields: {
          default: {
            type: 'text',
            analyzer: 'ma_kuromoji',
            term_vector: 'with_positions_offsets',
          },
        },
      },
      summary: {
        type: 'text',
        term_vector: 'with_positions_offsets',
        fields: {
          default: {
            type: 'text',
            analyzer: 'ma_kuromoji',
            term_vector: 'with_positions_offsets',
          },
        },
      },
      title: {
        type: 'text',
        term_vector: 'with_positions_offsets',
        fields: {
          default: {
            type: 'text',
            analyzer: 'ma_kuromoji',
            term_vector: 'with_positions_offsets',
          },
        },
      },
      type: {
        type: 'keyword',
      },
      createdAt: {
        type: 'date',
      },
      updatedAt: {
        type: 'date',
      },
      publishedAt: {
        type: 'date',
      },
      createdBy: {
        type: 'keyword',
      },
      id: {
        type: 'keyword',
      },
      media: {
        type: 'object',
        enabled: false,
      },
      coverMedia: {
        type: 'object',
        enabled: false,
      },
      linkPreview: {
        type: 'object',
        enabled: false,
      },
      mentionUserIds: {
        type: 'keyword',
      },
    },
  },
};
