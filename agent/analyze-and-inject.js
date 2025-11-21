/**
 * Mock AI Agent - Analyze and Inject
 * 
 * This script simulates a remote AI analysis service that:
 * 1. Analyzes a GitHub repository
 * 2. Generates project analysis data
 * 3. Injects the results into Sanity CMS
 */

import {createClient} from '@sanity/client'
import dotenv from 'dotenv'
import {mockTeamMembers, mockProject, mockJudgeNotes} from './mock-data.js'

// Load environment variables
dotenv.config()

// Initialize Sanity client
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: process.env.SANITY_API_VERSION || '2025-09-25',
  useCdn: false, // Always false for writes
  token: process.env.SANITY_WRITE_TOKEN,
})

/**
 * Create team members (hackers)
 */
async function createTeamMembers() {
  console.log('\n📝 Creating team members...')
  
  const createdMembers = []
  
  for (const member of mockTeamMembers) {
    try {
      const result = await client.create({
        _type: 'hacker',
        ...member,
      })
      console.log(`  ✅ Created: ${member.name} (ID: ${result._id})`)
      createdMembers.push(result)
    } catch (error) {
      console.error(`  ❌ Failed to create ${member.name}:`, error.message)
      throw error
    }
  }
  
  return createdMembers
}

/**
 * Create project with analysis data
 */
async function createProject(teamMemberIds) {
  console.log('\n🚀 Creating project...')
  
  try {
    // Add team references to project
    const projectData = {
      _type: 'project',
      ...mockProject,
      team: teamMemberIds.map(id => ({
        _type: 'reference',
        _ref: id,
      })),
    }
    
    const result = await client.create(projectData)
    console.log(`  ✅ Created project: ${result.projectName} (ID: ${result._id})`)
    console.log(`     Status: ${result.status}`)
    console.log(`     Sponsor integrations: ${result.sponsorIntegrations.length}`)
    
    return result
  } catch (error) {
    console.error('  ❌ Failed to create project:', error.message)
    throw error
  }
}

/**
 * Create judge notes for the project
 */
async function createJudgeNotes(projectId) {
  console.log('\n👨‍⚖️ Creating judge notes...')
  
  const createdNotes = []
  
  for (const note of mockJudgeNotes) {
    try {
      const result = await client.create({
        _type: 'judgeNote',
        ...note,
        project: {
          _type: 'reference',
          _ref: projectId,
        },
      })
      console.log(`  ✅ Created note from: ${note.judgeName} (Score: ${note.scoreOverride}/10)`)
      createdNotes.push(result)
    } catch (error) {
      console.error(`  ❌ Failed to create note from ${note.judgeName}:`, error.message)
      throw error
    }
  }
  
  return createdNotes
}

/**
 * Main execution
 */
async function main() {
  console.log('🤖 Mock AI Agent Starting...')
  console.log('=' .repeat(60))
  console.log('This agent simulates analyzing a GitHub repo and')
  console.log('injecting the analysis results into Sanity CMS.')
  console.log('=' .repeat(60))
  
  try {
    // Verify connection
    console.log('\n🔌 Testing Sanity connection...')
    const config = await client.config()
    console.log(`  ✅ Connected to project: ${config.projectId}`)
    console.log(`     Dataset: ${config.dataset}`)
    
    // Step 1: Create team members
    const teamMembers = await createTeamMembers()
    const teamMemberIds = teamMembers.map(m => m._id)
    
    // Step 2: Create project with analysis
    const project = await createProject(teamMemberIds)
    
    // Step 3: Create judge notes
    const judgeNotes = await createJudgeNotes(project._id)
    
    // Success!
    console.log('\n' + '='.repeat(60))
    console.log('✨ SUCCESS! Data injected successfully!')
    console.log('='.repeat(60))
    console.log('\n📊 Summary:')
    console.log(`   • Team members: ${teamMembers.length}`)
    console.log(`   • Project: ${project.projectName}`)
    console.log(`   • Sponsor integrations: ${project.sponsorIntegrations.length}`)
    console.log(`   • Judge notes: ${judgeNotes.length}`)
    console.log('\n🔗 View your data:')
    console.log(`   • Studio: http://localhost:3333/structure/project;${project._id}`)
    console.log(`   • Frontend: http://localhost:3000/projects/${project.slug.current}`)
    console.log('\n✅ The end-to-end workflow is working!')
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    console.error('\nTroubleshooting:')
    console.error('  1. Check that your .env file exists with correct credentials')
    console.error('  2. Verify SANITY_WRITE_TOKEN has Editor permissions')
    console.error('  3. Make sure Sanity Studio is running (npm run dev)')
    console.error('  4. Check that the schemas match (hacker, project, judgeNote)')
    process.exit(1)
  }
}

// Run the agent
main()

