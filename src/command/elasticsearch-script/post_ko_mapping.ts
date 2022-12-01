export const POST_KO_MAPPING = {
  settings: {
    analysis: {
      analyzer: {
        ma_nori: {
          filter: ['lowercase'],
          char_filter: ['html_strip', 'icu_normalizer'],
          tokenizer: 'nori_tokenizer',
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
            type: 'text',
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
      content: {
        type: 'text',
        term_vector: 'with_positions_offsets',
        fields: {
          default: {
            type: 'text',
            analyzer: 'ma_nori',
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
            analyzer: 'ma_nori',
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
            analyzer: 'ma_nori',
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
