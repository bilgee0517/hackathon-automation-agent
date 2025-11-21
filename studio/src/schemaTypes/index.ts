import {hacker} from './documents/hacker'
import {project} from './documents/project'
import {sponsorIntegration} from './objects/sponsorIntegration'

// Export an array of all the schema types for the hackathon dashboard
export const schemaTypes = [
  // Documents
  project,
  hacker,

  // Objects
  sponsorIntegration,
]
