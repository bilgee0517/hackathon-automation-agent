export default {
  name: 'sponsorIntegration',
  title: 'Sponsor Integration',
  type: 'object',
  fields: [
    {
      name: 'detected',
      title: 'Detected',
      type: 'boolean',
      description: 'Whether the sponsor technology was detected'
    },
    {
      name: 'integrationScore',
      title: 'Integration Score',
      type: 'number',
      description: 'Score from 0-10 indicating depth of integration',
      validation: (Rule: any) => Rule.min(0).max(10)
    },
    {
      name: 'technicalSummary',
      title: 'Technical Summary',
      type: 'text',
      description: 'Technical description for developers'
    },
    {
      name: 'plainEnglishSummary',
      title: 'Plain English Summary',
      type: 'text',
      description: 'Non-technical summary for general audience'
    },
    {
      name: 'evidence',
      title: 'Evidence',
      type: 'object',
      fields: [
        {
          name: 'files',
          title: 'Relevant Files',
          type: 'array',
          of: [{ type: 'string' }]
        },
        {
          name: 'codeSnippets',
          title: 'Code Snippets',
          type: 'array',
          of: [{ type: 'text' }]
        },
        {
          name: 'keyFindings',
          title: 'Key Findings',
          type: 'array',
          of: [{ type: 'string' }]
        }
      ]
    },
    {
      name: 'prizeEligible',
      title: 'Prize Eligible',
      type: 'boolean',
      description: 'Whether the integration qualifies for prize consideration'
    },
    {
      name: 'confidence',
      title: 'Confidence',
      type: 'number',
      description: 'Confidence score from 0-1',
      validation: (Rule: any) => Rule.min(0).max(1)
    },
    {
      name: 'suggestions',
      title: 'Suggestions',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Suggestions for improving the integration'
    }
  ]
};

