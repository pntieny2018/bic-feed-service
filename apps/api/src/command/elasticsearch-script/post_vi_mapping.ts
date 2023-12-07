export const POST_VI_MAPPING = {
  settings: {
    analysis: {
      analyzer: {
        ma_ascii: {
          filter: ['lowercase', 'asciifolding'],
          char_filter: ['html_strip'],
          tokenizer: 'uax_url_email',
        },
        ma_no_ascii: {
          filter: ['lowercase'],
          char_filter: ['html_strip'],
          tokenizer: 'uax_url_email',
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
      itemIds: {
        type: 'keyword',
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
      summary: {
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
      title: {
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
