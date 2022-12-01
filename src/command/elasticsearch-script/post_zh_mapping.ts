export const POST_ZH_MAPPING = {
  settings: {
    analysis: {
      analyzer: {
        ma_smartcn: {
          filter: ['lowercase', 'smartcn_stop', 'porter_stem'],
          char_filter: ['html_strip'],
          tokenizer: 'smartcn_tokenizer',
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
                analyzer: 'ma_smartcn',
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
                analyzer: 'ma_smartcn',
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
                analyzer: 'ma_smartcn',
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
