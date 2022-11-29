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
      community: {
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
      articleIds: {
        type: 'keyword',
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
                analyzer: 'ma_nori',
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
                analyzer: 'ma_nori',
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
                analyzer: 'ma_nori',
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
