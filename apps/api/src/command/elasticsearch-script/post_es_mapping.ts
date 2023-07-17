export const POST_ES_MAPPING = {
  settings: {
    analysis: {
      filter: {
        spanish_stop: {
          type: 'stop',
          stopwords: '_spanish_',
        },
        spanish_stemmer: {
          type: 'stemmer',
          language: 'light_spanish',
        },
      },
      analyzer: {
        ma_spanish: {
          filter: ['lowercase', 'spanish_stop', 'spanish_stemmer'],
          char_filter: ['html_strip'],
          tokenizer: 'standard',
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
      items: {
        properties: {
          id: {
            type: 'keyword',
          },
          zindex: {
            type: 'integer',
          },
        },
      },
      seriesIds: {
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
            analyzer: 'ma_spanish',
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
            analyzer: 'ma_spanish',
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
            analyzer: 'ma_spanish',
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
