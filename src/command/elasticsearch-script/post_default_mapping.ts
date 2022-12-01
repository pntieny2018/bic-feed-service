export const POST_DEFAULT_MAPPING = {
  settings: {
    analysis: {
      analyzer: {
        ma_ascii: {
          filter: ['icu_normalizer', 'lowercase', 'icu_folding'],
          char_filter: ['html_strip'],
          tokenizer: 'icu_tokenizer',
        },
        ma_no_ascii: {
          filter: ['icu_normalizer', 'lowercase'],
          char_filter: ['html_strip'],
          tokenizer: 'icu_tokenizer',
        },
      },
    },
  },
  mappings: {
    properties: {
      groupIds: {
        type: 'keyword',
      },
      communities: {
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
      categories: {
        properties: {
          id: {
            type: 'keyword',
          },
          name: {
            type: 'integer',
            index: false,
          },
        },
      },
      articles: {
        properties: {
          id: {
            type: 'keyword',
          },
          zindex: {
            type: 'integer',
          },
        },
      },
      commentsCount: {
        type: 'long',
      },
      totalUsersSeen: {
        type: 'long',
      },
      content: {
        properties: {
          language: {
            type: 'keyword',
          },
          text: {
            type: 'text',
            term_vector: 'with_positions_offsets',
            fields: {
              default: {
                type: 'text',
                analyzer: 'ma_no_ascii',
                term_vector: 'with_positions_offsets',
              },
              ascii: {
                type: 'text',
                analyzer: 'ma_ascii',
                term_vector: 'with_positions_offsets',
              },
            },
          },
        },
      },
      title: {
        properties: {
          language: {
            type: 'keyword',
          },
          text: {
            type: 'text',
            term_vector: 'with_positions_offsets',
            fields: {
              default: {
                type: 'text',
                analyzer: 'ma_no_ascii',
                term_vector: 'with_positions_offsets',
              },
              ascii: {
                type: 'text',
                analyzer: 'ma_ascii',
                term_vector: 'with_positions_offsets',
              },
            },
          },
        },
      },
      summary: {
        properties: {
          language: {
            type: 'keyword',
          },
          text: {
            type: 'text',
            term_vector: 'with_positions_offsets',
            fields: {
              default: {
                type: 'text',
                analyzer: 'ma_no_ascii',
                term_vector: 'with_positions_offsets',
              },
              ascii: {
                type: 'text',
                analyzer: 'ma_ascii',
                term_vector: 'with_positions_offsets',
              },
            },
          },
        },
      },
      type: {
        type: 'keyword',
      },
      createdAt: {
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
      linkPreview: {
        type: 'object',
        enabled: false,
      },
      coverMedia: {
        type: 'object',
        enabled: false,
      },
      mentionUserIds: {
        type: 'keyword',
      },
    },
  },
};
