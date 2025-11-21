import {defineType, defineField} from 'sanity'

/**
 * Sponsor Analysis object - matches backend AI analysis output
 * Represents the AI's analysis of a sponsor technology integration
 */

export const sponsorAnalysis = defineType({
  name: 'sponsorAnalysis',
  title: 'Sponsor Analysis',
  type: 'object',
  fields: [
    defineField({
      name: 'detected',
      title: 'Detected',
      type: 'boolean',
      description: 'Whether this sponsor technology was detected in the project',
      initialValue: false,
    }),
    defineField({
      name: 'integrationScore',
      title: 'Integration Score',
      type: 'number',
      description: 'Depth of integration (0-10)',
      validation: (rule) => rule.min(0).max(10),
    }),
    defineField({
      name: 'technicalSummary',
      title: 'Technical Summary',
      type: 'text',
      rows: 4,
      description: 'Technical explanation of how the sponsor tool was integrated (for developers)',
    }),
    defineField({
      name: 'plainEnglishSummary',
      title: 'Plain English Summary',
      type: 'text',
      rows: 3,
      description: 'Non-technical explanation of the integration (for non-technical stakeholders)',
    }),
    defineField({
      name: 'evidence',
      title: 'Evidence',
      type: 'object',
      description: 'Evidence found by the AI agent',
      fields: [
        {
          name: 'files',
          title: 'Files',
          type: 'array',
          of: [{type: 'string'}],
          description: 'File paths where the sponsor technology was found',
        },
        {
          name: 'codeSnippets',
          title: 'Code Snippets',
          type: 'array',
          of: [{type: 'text'}],
          description: 'Relevant code snippets showing usage',
        },
        {
          name: 'keyFindings',
          title: 'Key Findings',
          type: 'array',
          of: [{type: 'string'}],
          description: 'Important findings about the integration',
        },
      ],
    }),
    defineField({
      name: 'prizeEligible',
      title: 'Prize Eligible',
      type: 'boolean',
      description: 'AI recommendation: Is this integration deep enough for sponsor prize eligibility?',
      initialValue: false,
    }),
    defineField({
      name: 'confidence',
      title: 'Confidence',
      type: 'number',
      description: 'AI confidence in this analysis (0-1)',
      validation: (rule) => rule.min(0).max(1),
    }),
    defineField({
      name: 'suggestions',
      title: 'Suggestions',
      type: 'array',
      of: [{type: 'string'}],
      description: 'AI suggestions for improving the integration',
    }),
  ],
  preview: {
    select: {
      detected: 'detected',
      score: 'integrationScore',
      eligible: 'prizeEligible',
    },
    prepare({detected, score, eligible}) {
      const detectedIcon = detected ? '✅' : '❌'
      const eligibleIcon = eligible ? '🏆' : ''
      return {
        title: `${detectedIcon} Score: ${score || 0}/10 ${eligibleIcon}`,
        subtitle: detected ? 'Detected' : 'Not detected',
      }
    },
  },
})

