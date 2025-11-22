export default {
  name: 'hacker',
  title: 'Hacker (Team Member)',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule: any) => Rule.email()
    },
    {
      name: 'githubUsername',
      title: 'GitHub Username',
      type: 'string'
    },
    {
      name: 'bio',
      title: 'Bio',
      type: 'text'
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'githubUsername'
    }
  }
};

