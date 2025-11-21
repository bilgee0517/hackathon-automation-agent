import {defineType, defineField} from 'sanity'

/**
 * Sponsor Integration object - embedded in project documents
 * Represents how a project used a specific sponsor's tools/APIs
 */

export const sponsorIntegration = defineType({
  name: 'sponsorIntegration',
  title: 'Sponsor Integration',
  type: 'object',
  fields: [
    defineField({
      name: 'sponsorSlug',
      title: 'Sponsor Slug',
      type: 'string',
      description: 'e.g., "trm", "redis", "postman", "skyflow"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sponsorName',
      title: 'Sponsor Name',
      type: 'string',
      description: 'Human-readable name (e.g., "TRM Labs", "Redis")',
    }),
    defineField({
      name: 'aiSummary',
      title: 'AI Summary',
      type: 'text',
      rows: 6,
      description: 'Detailed explanation of how this sponsor tool was integrated',
    }),
    defineField({
      name: 'integrationDepth',
      title: 'Integration Depth',
      type: 'string',
      options: {
        list: [
          {title: '🔥 Core - Central to the project', value: 'core'},
          {title: '⭐ Significant - Important feature', value: 'significant'},
          {title: '💡 Moderate - Nice integration', value: 'moderate'},
          {title: '📌 Minor - Small usage', value: 'minor'},
          {title: '👀 Mentioned - Just imported', value: 'mentioned'},
        ],
      },
    }),
    defineField({
      name: 'toolsUsed',
      title: 'Specific Tools/APIs Used',
      type: 'array',
      of: [{type: 'string'}],
      description: 'e.g., ["TRM Risk API", "TRM Screening API"]',
    }),
    defineField({
      name: 'codeEvidence',
      title: 'Code Evidence',
      type: 'array',
      of: [{type: 'text'}],
      description: 'File paths, import statements, or code snippets showing usage',
    }),
    defineField({
      name: 'userFacingFeatures',
      title: 'User-Facing Features',
      type: 'array',
      of: [{type: 'string'}],
      description: 'UI features built with this sponsor tool',
    }),
    defineField({
      name: 'technicalScore',
      title: 'Technical Implementation Score',
      type: 'number',
      description: 'How well was this tool implemented? (0-10)',
      validation: (rule) => rule.min(0).max(10),
    }),
    defineField({
      name: 'creativityScore',
      title: 'Creativity Score',
      type: 'number',
      description: 'How creative/unique is this integration? (0-10)',
      validation: (rule) => rule.min(0).max(10),
    }),
  ],
  preview: {
    select: {
      sponsor: 'sponsorName',
      depth: 'integrationDepth',
      technical: 'technicalScore',
    },
    prepare({sponsor, depth, technical}) {
      return {
        title: sponsor || 'Unnamed Sponsor',
        subtitle: `${depth || 'unrated'} | Technical: ${technical || 'N/A'}/10`,
      }
    },
  },
})

