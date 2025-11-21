export default {
  name: 'project',
  title: 'Hackathon Project',
  type: 'document',
  fields: [
    {
      name: 'projectName',
      title: 'Project Name',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'projectName',
        maxLength: 96
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Short one-line description'
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Detailed project description'
    },
    {
      name: 'githubUrl',
      title: 'GitHub URL',
      type: 'url',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'githubData',
      title: 'GitHub Data',
      type: 'object',
      fields: [
        { name: 'stars', type: 'number', title: 'Stars' },
        { name: 'forks', type: 'number', title: 'Forks' },
        { name: 'language', type: 'string', title: 'Main Language' },
        { name: 'lastCommit', type: 'datetime', title: 'Last Commit' }
      ]
    },
    {
      name: 'team',
      title: 'Team Members',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'hacker' }] }],
      description: 'Team members working on this project'
    },
    {
      name: 'analysisData',
      title: 'Analysis Data',
      type: 'object',
      fields: [
        {
          name: 'aiSummaryForJudges',
          type: 'text',
          title: 'AI Summary for Judges',
          description: 'AI-generated summary for judges'
        },
        {
          name: 'latestAnalysisAt',
          type: 'datetime',
          title: 'Latest Analysis At'
        },
        {
          name: 'tags',
          type: 'array',
          title: 'Tags',
          of: [{ type: 'string' }]
        }
      ]
    },
    {
      name: 'sponsorIntegrations',
      title: 'Sponsor Integrations',
      type: 'array',
      of: [{ type: 'sponsorIntegration' }],
      description: 'Detected sponsor technology integrations'
    },
    {
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      description: 'When the project was submitted'
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Submitted', value: 'submitted' },
          { title: 'Analyzing', value: 'analyzing' },
          { title: 'Analyzed', value: 'analyzed' },
          { title: 'Judging', value: 'judging' },
          { title: 'Completed', value: 'completed' }
        ]
      },
      validation: (Rule: any) => Rule.required()
    }
  ],
  preview: {
    select: {
      title: 'projectName',
      subtitle: 'tagline',
      status: 'status'
    },
    prepare({ title, subtitle, status }: any) {
      return {
        title,
        subtitle: `${status ? `[${status}] ` : ''}${subtitle || ''}`
      };
    }
  }
};

