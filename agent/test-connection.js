/**
 * Test Sanity Connection
 * Quick script to verify that the agent can connect to Sanity
 */

import {createClient} from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config()

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: process.env.SANITY_API_VERSION || '2025-09-25',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
})

async function testConnection() {
  console.log('🔌 Testing Sanity connection...\n')
  
  try {
    // Test 1: Get client config
    const config = client.config()
    console.log('✅ Client configured:')
    console.log(`   Project ID: ${config.projectId}`)
    console.log(`   Dataset: ${config.dataset}`)
    console.log(`   API Version: ${config.apiVersion}`)
    console.log(`   Token: ${config.token ? '***' + config.token.slice(-8) : 'Not set'}\n`)
    
    // Test 2: Query existing documents
    console.log('📊 Querying existing projects...')
    const projects = await client.fetch('*[_type == "project"][0...5]{projectName, _id}')
    console.log(`   Found ${projects.length} projects:`)
    projects.forEach(p => console.log(`   - ${p.projectName} (${p._id})`))
    
    // Test 3: Check write permissions by fetching count
    console.log('\n🔐 Testing permissions...')
    const count = await client.fetch('count(*[_type == "project"])')
    console.log(`   ✅ Can read: ${count} total projects`)
    
    if (!config.token) {
      console.log('\n⚠️  WARNING: No write token configured!')
      console.log('   Set SANITY_WRITE_TOKEN in .env to enable data injection')
    } else {
      console.log('   ✅ Write token is configured')
    }
    
    console.log('\n✨ Connection test successful!')
    console.log('   Ready to inject data. Run: npm run inject')
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message)
    console.error('\nPlease check:')
    console.error('  1. .env file exists with correct values')
    console.error('  2. SANITY_PROJECT_ID is correct')
    console.error('  3. SANITY_DATASET exists (usually "production")')
    console.error('  4. SANITY_WRITE_TOKEN is valid and has Editor permissions')
    process.exit(1)
  }
}

testConnection()

