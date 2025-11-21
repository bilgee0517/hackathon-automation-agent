import {RocketIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

/**
 * Project schema - represents a hackathon project submission
 */

export const project = defineType({
  name: 'project',
  title: 'Hackathon Project',
  icon: RocketIcon,
  type: 'document',
  fields: [
    // Basic Info
    defineField({
      name: 'projectName',
      title: 'Project Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'projectName',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Short one-liner about the project',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    }),

    // GitHub Integration
    defineField({
      name: 'githubUrl',
      title: 'GitHub Repository URL',
      type: 'url',
      validation: (rule) =>
        rule.required().uri({
          scheme: ['https'],
          allowRelative: false,
        }),
    }),
    defineField({
      name: 'githubData',
      title: 'GitHub Metadata',
      type: 'object',
      fields: [
        {name: 'stars', type: 'number', title: 'Stars'},
        {name: 'forks', type: 'number', title: 'Forks'},
        {name: 'language', type: 'string', title: 'Primary Language'},
        {name: 'lastCommit', type: 'datetime', title: 'Last Commit'},
      ],
    }),

    // Team
    defineField({
      name: 'team',
      title: 'Team Members',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'hacker'}]}],
    }),

    // AI Analysis Output
    defineField({
      name: 'analysisData',
      title: 'AI Analysis Data',
      type: 'object',
      description: 'Automatically populated by the AI agent',
      fields: [
        {
          name: 'aiSummaryForJudges',
          title: 'AI Summary for Judges',
          type: 'text',
          rows: 6,
          description: 'General summary explaining the project for judges',
        },
        {
          name: 'latestAnalysisAt',
          title: 'Latest Analysis Time',
          type: 'datetime',
          description: 'When the agent last analyzed this project',
        },
        {
          name: 'tags',
          title: 'Tags',
          type: 'array',
          of: [{type: 'string'}],
          description: 'Keywords for filtering (sponsor names, categories, etc.)',
        },
      ],
    }),

    // Sponsor Integration Details
    defineField({
      name: 'sponsorIntegrations',
      title: 'Sponsor Integrations',
      type: 'array',
      of: [{type: 'sponsorIntegration'}],
      description: 'Detailed breakdown of how each sponsor tool was used',
    }),

    // Submission Info
    defineField({
      name: 'submittedAt',
      title: 'Submission Date',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: '⏳ Analyzing', value: 'analyzing'},
          {title: '✅ Analyzed', value: 'analyzed'},
          {title: '❌ Failed', value: 'failed'},
          {title: '🏆 Winner', value: 'winner'},
        ],
      },
      initialValue: 'analyzing',
    }),

    // Media
    defineField({
      name: 'screenshots',
      title: 'Screenshots',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative text',
              description: 'Important for accessibility',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'demoUrl',
      title: 'Live Demo URL',
      type: 'url',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Demo Video URL',
      type: 'url',
    }),
    defineField({
      name: 'judgeNotes',
      title: 'Judge Notes',
      description: 'Feedback and evaluations from judges',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'judgeNote',
          title: 'Judge Note',
          fields: [
            {
              name: 'judgeName',
              title: 'Judge Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'judgeRole',
              title: 'Judge Role',
              type: 'string',
              options: {
                list: [
                  {title: 'Head Judge', value: 'head'},
                  {title: 'Technical Judge', value: 'technical'},
                  {title: 'Sponsor Judge', value: 'sponsor'},
                  {title: 'Community Judge', value: 'community'},
                ],
              },
            },
            {
              name: 'sponsorAffiliation',
              title: 'Sponsor Affiliation',
              description: 'Which sponsor company this judge represents (if any)',
              type: 'string',
            },
            {
              name: 'comment',
              title: 'Comment',
              type: 'text',
              rows: 4,
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'scoreOverride',
              title: 'Score Override',
              description: 'Manual score from judge (0-10)',
              type: 'number',
              validation: (Rule) => Rule.min(0).max(10).precision(1),
            },
            {
              name: 'highlightedFor',
              title: 'Highlighted For Prize',
              description: 'Which prize category this project should be considered for',
              type: 'string',
              options: {
                list: [
                  {title: 'Best Overall', value: 'best-overall'},
                  {title: 'Best Use of TRM', value: 'best-use-of-trm'},
                  {title: 'Best Use of Redis', value: 'best-use-of-redis'},
                  {title: 'Best Use of Postman', value: 'best-use-of-postman'},
                  {title: 'Best Use of Skyflow', value: 'best-use-of-skyflow'},
                  {title: 'Best Use of Sanity', value: 'best-use-of-sanity'},
                  {title: 'Most Creative', value: 'most-creative'},
                  {title: 'Best Technical', value: 'best-technical'},
                  {title: 'Best Design', value: 'best-design'},
                  {title: 'Best Social Impact', value: 'best-social-impact'},
                  {title: 'Fan Favorite', value: 'fan-favorite'},
                ],
              },
            },
            {
              name: 'isPublic',
              title: 'Public Note',
              description: 'If enabled, this note will be visible to participants',
              type: 'boolean',
              initialValue: true,
            },
            {
              name: 'createdAt',
              title: 'Created At',
              type: 'datetime',
              initialValue: () => new Date().toISOString(),
            },
          ],
          preview: {
            select: {
              judgeName: 'judgeName',
              comment: 'comment',
              score: 'scoreOverride',
              isPublic: 'isPublic',
            },
            prepare(selection: {
              judgeName?: string
              comment?: string
              score?: number
              isPublic?: boolean
            }) {
              const {judgeName, comment, score, isPublic} = selection
              const publicIcon = isPublic ? '🌐' : '🔒'
              const scoreText = score ? ` | ${score}/10` : ''
              return {
                title: `${publicIcon} ${judgeName || 'Unnamed Judge'}${scoreText}`,
                subtitle: comment?.slice(0, 100) || 'No comment',
              }
            },
          },
        },
      ],
    }),
  ],

  preview: {
    select: {
      title: 'projectName',
      team: 'team',
      status: 'status',
      media: 'screenshots.0',
    },
    prepare(selection: {
      title?: string
      team?: any[]
      status?: string
      media?: any
    }) {
      const {title, team, status, media} = selection
      const statusEmoji =
        {
          analyzing: '⏳',
          analyzed: '✅',
          failed: '❌',
          winner: '🏆',
        }[status || ''] || ''

      return {
        title: title || 'Untitled Project',
        subtitle: `${statusEmoji} ${status || 'unknown'} | Team: ${team?.length || 0} members`,
        media,
      }
    },
  },
})

