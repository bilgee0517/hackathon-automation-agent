export default {
  name: 'sponsorIntegration',
  title: 'Sponsor Integration',
  type: 'object',
  fields: [
    {
      name: 'sponsorSlug',
      title: 'Sponsor Slug',
      type: 'string',
      description: 'Unique identifier for the sponsor'
    },
    {
      name: 'sponsorName',
      title: 'Sponsor Name',
      type: 'string'
    },
    {
      name: 'aiSummary',
      title: 'AI Summary',
      type: 'text',
      description: 'AI-generated summary of the integration'
    },
    {
      name: 'integrationDepth',
      title: 'Integration Depth',
      type: 'string',
      options: {
        list: [
          { title: 'Core (Central to functionality)', value: 'core' },
          { title: 'Significant (Important feature)', value: 'significant' },
          { title: 'Supporting (Helper/utility)', value: 'supporting' },
          { title: 'Minimal (Basic usage)', value: 'minimal' }
        ]
      }
    },
    {
      name: 'toolsUsed',
      title: 'Tools Used',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Specific tools/APIs/features used from the sponsor'
    },
    {
      name: 'technicalScore',
      title: 'Technical Score',
      type: 'number',
      description: 'Technical implementation quality (0-10)',
      validation: (Rule: any) => Rule.min(0).max(10)
    },
    {
      name: 'creativityScore',
      title: 'Creativity Score',
      type: 'number',
      description: 'Creativity and innovation score (0-10)',
      validation: (Rule: any) => Rule.min(0).max(10)
    },
    {
      name: 'codeEvidence',
      title: 'Code Evidence',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'File paths and descriptions showing integration'
    },
    {
      name: 'userFacingFeatures',
      title: 'User Facing Features',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Features visible to end users'
    }
  ]
};

