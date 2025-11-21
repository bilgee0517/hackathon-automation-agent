import {UserIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

/**
 * Hacker schema - represents hackathon participants
 */

export const hacker = defineType({
  name: 'hacker',
  title: 'Hacker',
  icon: UserIcon,
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'githubUsername',
      title: 'GitHub Username',
      type: 'string',
    }),
    defineField({
      name: 'avatar',
      title: 'Avatar',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'githubUsername',
      media: 'avatar',
    },
    prepare({title, subtitle, media}) {
      return {
        title,
        subtitle: subtitle ? `@${subtitle}` : 'No GitHub username',
        media,
      }
    },
  },
})

