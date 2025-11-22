export default {
  name: 'judgeNote',
  title: 'Judge Note',
  type: 'document',
  fields: [
    {
      name: 'project',
      title: 'Project',
      type: 'reference',
      to: [{ type: 'project' }],
      validation: (Rule: any) => Rule.required(),
      description: 'The project this note is about'
    },
    {
      name: 'judgeName',
      title: 'Judge Name',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'judgeRole',
      title: 'Judge Role',
      type: 'string',
      options: {
        list: [
          { title: 'Head Judge', value: 'head' },
          { title: 'Technical Judge', value: 'technical' },
          { title: 'Sponsor Judge', value: 'sponsor' }
        ]
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'sponsorAffiliation',
      title: 'Sponsor Affiliation',
      type: 'string',
      description: 'Sponsor name if judge role is "sponsor"',
      hidden: ({ parent }: any) => parent?.judgeRole !== 'sponsor'
    },
    {
      name: 'comment',
      title: 'Comment',
      type: 'text',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'scoreOverride',
      title: 'Score Override',
      type: 'number',
      description: 'Manual score from 0-10',
      validation: (Rule: any) => Rule.min(0).max(10)
    },
    {
      name: 'isPublic',
      title: 'Is Public',
      type: 'boolean',
      description: 'Whether this note is visible to the public'
    },
    {
      name: 'highlightedFor',
      title: 'Highlighted For',
      type: 'string',
      description: 'Special category this note highlights (e.g., "best-overall", "best-use-of-x")'
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      validation: (Rule: any) => Rule.required()
    }
  ],
  preview: {
    select: {
      title: 'judgeName',
      subtitle: 'comment',
      score: 'scoreOverride',
      projectName: 'project.projectName'
    },
    prepare({ title, subtitle, score, projectName }: any) {
      return {
        title: `${title} - ${projectName || 'Unknown Project'}`,
        subtitle: `Score: ${score}/10 - ${subtitle?.substring(0, 100) || ''}...`
      };
    }
  }
};

