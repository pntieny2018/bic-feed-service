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
