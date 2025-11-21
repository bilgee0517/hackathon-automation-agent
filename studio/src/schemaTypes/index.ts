import {hacker} from './documents/hacker'
import {project} from './documents/project'
import {sponsorAnalysis} from './objects/sponsorAnalysis'

// Export an array of all the schema types for the hackathon dashboard
export const schemaTypes = [
  // Documents
  project,
  hacker,

  // Objects
  sponsorAnalysis,
]
