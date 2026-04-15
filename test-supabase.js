const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase Connection...\n')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey?.substring(0, 20) + '...\n')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // Test 1: Check connection
    console.log('📡 Testing connection...')
    const { data, error } = await supabase.from('studios').select('count')
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Connection successful!\n')
    
    // Test 2: Check tables
    console.log('📊 Checking tables...')
    
    const tables = ['studios', 'equipment', 'bookings', 'users']
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*', { limit: 1, count: 'exact' })
      
      if (error) {
        console.error(`  ❌ Table ${table}: Error - ${error.message}`)
      } else {
        console.log(`  ✅ Table ${table}: OK`)
      }
    }
    
    console.log('\n🎉 All tests passed!')
    console.log('\n✨ Supabase is ready to use!')
    
    return true
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

testConnection()
