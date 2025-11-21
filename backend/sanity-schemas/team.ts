export default {
  name: 'team',
  title: 'Hackathon Team',
  type: 'document',
  fields: [
    {
      name: 'teamName',
      title: 'Team Name',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'projectName',
      title: 'Project Name',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'githubUrl',
      title: 'GitHub URL',
      type: 'url',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'analyzedAt',
      title: 'Analyzed At',
      type: 'datetime',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'repositoryStats',
      title: 'Repository Statistics',
      type: 'object',
      fields: [
        { name: 'mainLanguage', type: 'string', title: 'Main Language' },
        { name: 'totalFiles', type: 'number', title: 'Total Files' },
        { name: 'hasTests', type: 'boolean', title: 'Has Tests' },
        { name: 'testsPassed', type: 'boolean', title: 'Tests Passed' },
        { 
          name: 'dependencies', 
          type: 'array', 
          title: 'Dependencies',
          of: [{ type: 'string' }]
        }
      ]
    },
    {
      name: 'sponsors',
      title: 'Sponsor Analysis',
      type: 'object',
      description: 'Analysis results for each sponsor technology',
      fields: [
        { name: 'aws', type: 'sponsorIntegration', title: 'AWS' },
        { name: 'skyflow', type: 'sponsorIntegration', title: 'Skyflow' },
        { name: 'postman', type: 'sponsorIntegration', title: 'Postman' },
        { name: 'redis', type: 'sponsorIntegration', title: 'Redis' },
        { name: 'forethought', type: 'sponsorIntegration', title: 'Forethought' },
        { name: 'finsterAI', type: 'sponsorIntegration', title: 'Finster AI' },
        { name: 'senso', type: 'sponsorIntegration', title: 'Senso' },
        { name: 'anthropic', type: 'sponsorIntegration', title: 'Anthropic' },
        { name: 'sanity', type: 'sponsorIntegration', title: 'Sanity' },
        { name: 'trmLabs', type: 'sponsorIntegration', title: 'TRM Labs' },
        { name: 'coder', type: 'sponsorIntegration', title: 'Coder' },
        { name: 'lightpanda', type: 'sponsorIntegration', title: 'Lightpanda' },
        { name: 'lightningAI', type: 'sponsorIntegration', title: 'Lightning AI' },
        { name: 'parallel', type: 'sponsorIntegration', title: 'Parallel' },
        { name: 'cleric', type: 'sponsorIntegration', title: 'Cleric' }
      ]
    },
    {
      name: 'overallSummary',
      title: 'Overall Summary',
      type: 'text',
      description: 'High-level summary of the project'
    },
    {
      name: 'innovativeAspects',
      title: 'Innovative Aspects',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Unique or creative aspects of the project'
    }
  ],
  preview: {
    select: {
      title: 'teamName',
      subtitle: 'projectName',
      analyzedAt: 'analyzedAt'
    },
    prepare(selection: any) {
      const { title, subtitle, analyzedAt } = selection;
      return {
        title,
        subtitle: `${subtitle} - ${new Date(analyzedAt).toLocaleDateString()}`
      };
    }
  }
};

