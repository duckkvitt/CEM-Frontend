// Test file for CEM AI Context System
// This file demonstrates how to use the enhanced AI context system

import { 
  findRelevantFAQ, 
  findRelevantOnboarding, 
  findRelevantScenarios 
} from './context'

// Test FAQ search functionality
export function testFAQSearch() {
  console.log('🔍 Testing FAQ Search Functionality...')
  
  const testQueries = [
    'how do I log in',
    'password reset',
    'device warranty',
    'service request',
    'contract management',
    'profile update'
  ]
  
  testQueries.forEach(query => {
    console.log(`\n📝 Query: "${query}"`)
    const results = findRelevantFAQ(query)
    
    if (results.length > 0) {
      console.log(`✅ Found ${results.length} relevant FAQ entries:`)
      results.slice(0, 3).forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.question}`)
        console.log(`      Relevance: ${result.relevance}`)
      })
    } else {
      console.log('❌ No relevant FAQ entries found')
    }
  })
}

// Test onboarding search functionality
export function testOnboardingSearch() {
  console.log('\n🚀 Testing Onboarding Search Functionality...')
  
  const testQueries = [
    'first time setup',
    'dashboard orientation',
    'profile setup',
    'device discovery',
    'contract review',
    'mobile access'
  ]
  
  testQueries.forEach(query => {
    console.log(`\n📝 Query: "${query}"`)
    const results = findRelevantOnboarding(query)
    
    if (results.length > 0) {
      console.log(`✅ Found ${results.length} relevant onboarding topics:`)
      results.slice(0, 3).forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.title}`)
        console.log(`      Description: ${result.description}`)
        console.log(`      Relevance: ${result.relevance}`)
      })
    } else {
      console.log('❌ No relevant onboarding topics found')
    }
  })
}

// Test scenario search functionality
export function testScenarioSearch() {
  console.log('\n🎭 Testing Scenario Search Functionality...')
  
  const testQueries = [
    'device not working',
    'warranty expiring',
    'urgent repair',
    'contract renewal',
    'payment issues',
    'company information update'
  ]
  
  testQueries.forEach(query => {
    console.log(`\n📝 Query: "${query}"`)
    const results = findRelevantScenarios(query)
    
    if (results.length > 0) {
      console.log(`✅ Found ${results.length} relevant scenarios:`)
      results.slice(0, 3).forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.title}`)
        console.log(`      Description: ${result.description}`)
        console.log(`      Relevance: ${result.relevance}`)
      })
    } else {
      console.log('❌ No relevant scenarios found')
    }
  })
}

// Test comprehensive search across all knowledge sources
export function testComprehensiveSearch() {
  console.log('\n🌟 Testing Comprehensive Knowledge Search...')
  
  const comprehensiveQuery = 'device maintenance and warranty'
  console.log(`\n📝 Comprehensive Query: "${comprehensiveQuery}"`)
  
  // Search across all knowledge sources
  const faqResults = findRelevantFAQ(comprehensiveQuery)
  const onboardingResults = findRelevantOnboarding(comprehensiveQuery)
  const scenarioResults = findRelevantScenarios(comprehensiveQuery)
  
  console.log('\n📚 FAQ Results:')
  if (faqResults.length > 0) {
    faqResults.slice(0, 2).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.question}`)
    })
  } else {
    console.log('   No relevant FAQ entries')
  }
  
  console.log('\n🚀 Onboarding Results:')
  if (onboardingResults.length > 0) {
    onboardingResults.slice(0, 2).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.title}`)
    })
  } else {
    console.log('   No relevant onboarding topics')
  }
  
  console.log('\n🎭 Scenario Results:')
  if (scenarioResults.length > 0) {
    scenarioResults.slice(0, 2).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.title}`)
    })
  } else {
    console.log('   No relevant scenarios')
  }
}

// Test edge cases and error handling
export function testEdgeCases() {
  console.log('\n⚠️ Testing Edge Cases and Error Handling...')
  
  const edgeCaseQueries = [
    '', // Empty query
    '   ', // Whitespace only
    'xyz123', // No matches
    'a'.repeat(1000), // Very long query
    '!@#$%^&*()', // Special characters
    'device AND warranty OR maintenance', // Complex query
  ]
  
  edgeCaseQueries.forEach((query, index) => {
    console.log(`\n📝 Edge Case ${index + 1}: "${query}"`)
    
    try {
      const faqResults = findRelevantFAQ(query)
      const onboardingResults = findRelevantOnboarding(query)
      const scenarioResults = findRelevantScenarios(query)
      
      console.log(`   FAQ: ${faqResults.length} results`)
      console.log(`   Onboarding: ${onboardingResults.length} results`)
      console.log(`   Scenarios: ${scenarioResults.length} results`)
    } catch (error) {
      console.log(`   ❌ Error: ${error}`)
    }
  })
}

// Main test runner
export function runAllTests() {
  console.log('🧠 CEM AI Context System - Test Suite')
  console.log('=====================================')
  
  try {
    testFAQSearch()
    testOnboardingSearch()
    testScenarioSearch()
    testComprehensiveSearch()
    testEdgeCases()
    
    console.log('\n✅ All tests completed successfully!')
    console.log('\n📊 Test Summary:')
    console.log('- FAQ Search: ✅ Tested')
    console.log('- Onboarding Search: ✅ Tested')
    console.log('- Scenario Search: ✅ Tested')
    console.log('- Comprehensive Search: ✅ Tested')
    console.log('- Edge Cases: ✅ Tested')
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error)
  }
}

// Example usage functions for developers
export function demonstrateFAQUsage() {
  console.log('\n📖 FAQ Usage Examples:')
  
  // Example 1: Password-related query
  const passwordQuery = 'forgot password'
  const passwordResults = findRelevantFAQ(passwordQuery)
  console.log(`\nQuery: "${passwordQuery}"`)
  console.log(`Results: ${passwordResults.length} FAQ entries found`)
  
  if (passwordResults.length > 0) {
    const bestMatch = passwordResults[0]
    console.log(`Best match: ${bestMatch.question}`)
    console.log(`Answer preview: ${bestMatch.answer.substring(0, 100)}...`)
  }
  
  // Example 2: Device-related query
  const deviceQuery = 'device status'
  const deviceResults = findRelevantFAQ(deviceQuery)
  console.log(`\nQuery: "${deviceQuery}"`)
  console.log(`Results: ${deviceResults.length} FAQ entries found`)
  
  if (deviceResults.length > 0) {
    const bestMatch = deviceResults[0]
    console.log(`Best match: ${bestMatch.question}`)
    console.log(`Answer preview: ${bestMatch.answer.substring(0, 100)}...`)
  }
}

export function demonstrateOnboardingUsage() {
  console.log('\n🚀 Onboarding Usage Examples:')
  
  // Example 1: First-time user query
  const firstTimeQuery = 'first time setup'
  const firstTimeResults = findRelevantOnboarding(firstTimeQuery)
  console.log(`\nQuery: "${firstTimeQuery}"`)
  console.log(`Results: ${firstTimeResults.length} onboarding topics found`)
  
  if (firstTimeResults.length > 0) {
    const bestMatch = firstTimeResults[0]
    console.log(`Best match: ${bestMatch.title}`)
    console.log(`Description: ${bestMatch.description}`)
  }
  
  // Example 2: Profile setup query
  const profileQuery = 'profile setup'
  const profileResults = findRelevantOnboarding(profileQuery)
  console.log(`\nQuery: "${profileQuery}"`)
  console.log(`Results: ${profileResults.length} onboarding topics found`)
  
  if (profileResults.length > 0) {
    const bestMatch = profileResults[0]
    console.log(`Best match: ${bestMatch.title}`)
    console.log(`Description: ${bestMatch.description}`)
  }
}

export function demonstrateScenarioUsage() {
  console.log('\n🎭 Scenario Usage Examples:')
  
  // Example 1: Device problem query
  const deviceProblemQuery = 'device malfunction'
  const deviceProblemResults = findRelevantScenarios(deviceProblemQuery)
  console.log(`\nQuery: "${deviceProblemQuery}"`)
  console.log(`Results: ${deviceProblemResults.length} scenarios found`)
  
  if (deviceProblemResults.length > 0) {
    const bestMatch = deviceProblemResults[0]
    console.log(`Best match: ${bestMatch.title}`)
    console.log(`Description: ${bestMatch.description}`)
  }
  
  // Example 2: Contract query
  const contractQuery = 'contract renewal'
  const contractResults = findRelevantScenarios(contractQuery)
  console.log(`\nQuery: "${contractQuery}"`)
  console.log(`Results: ${contractResults.length} scenarios found`)
  
  if (contractResults.length > 0) {
    const bestMatch = contractResults[0]
    console.log(`Best match: ${bestMatch.title}`)
    console.log(`Description: ${bestMatch.description}`)
  }
}

// Export all test functions
export default {
  runAllTests,
  testFAQSearch,
  testOnboardingSearch,
  testScenarioSearch,
  testComprehensiveSearch,
  testEdgeCases,
  demonstrateFAQUsage,
  demonstrateOnboardingUsage,
  demonstrateScenarioUsage
}

