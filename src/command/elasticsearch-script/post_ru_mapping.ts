export const POST_RU_MAPPING = {
  settings: {
    analysis: {
      filter: {
        russian_stop: {
          type: 'stop',
          stopwords: '_russian_',
        },
        russian_stemmer: {
          type: 'stemmer',
          language: 'russian',
        },
      },
      analyzer: {
        ma_russian: {
          filter: ['lowercase', 'russian_stop', 'russian_stemmer'],
          char_filter: ['html_strip'],
          tokenizer: 'standard',
        },
      },
    },
  },
  mappings: {
    properties: {
      actor: {
        properties: {
          avatar: {
            type: 'keyword',
          },
          email: {
            type: 'keyword',
          },
          fullname: {
            type: 'text',
          },
          groups: {
            type: 'keyword',
          },
          id: {
            type: 'keyword',
          },
          username: {
            type: 'keyword',
          },
        },
      },
      audience: {
        properties: {
          groups: {
            properties: {
              child: {
                type: 'keyword',
              },
              icon: {
                type: 'keyword',
              },
              id: {
                type: 'keyword',
              },
              isCommunity: {
                type: 'boolean',
              },
              name: {
                type: 'text',
              },
              privacy: {
                type: 'keyword',
              },
              communityId: {
                type: 'keyword',
              },
            },
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
                analyzer: 'ma_russian',
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
                analyzer: 'ma_russian',
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
                analyzer: 'ma_russian',
                term_vector: 'with_positions_offsets',
              },
            },
          },
        },
      },
      isArticle: {
        type: 'boolean',
      },
      createdAt: {
        type: 'date',
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
      mentions: {
        type: 'object',
        enabled: false,
      },
      setting: {
        properties: {
          canComment: {
            type: 'boolean',
          },
          canReact: {
            type: 'boolean',
          },
          canShare: {
            type: 'boolean',
          },
          importantExpiredAt: {
            type: 'date',
          },
          isImportant: {
            type: 'boolean',
          },
        },
      },
    },
  },
};
