import { promises as fs } from 'fs'
import path from 'path'
import { CUSTOMER_FAQ, findRelevantFAQ } from './customer-faq'
import { CUSTOMER_ONBOARDING, findRelevantOnboarding } from './customer-onboarding'
import { CUSTOMER_SCENARIOS, findRelevantScenarios } from './customer-scenarios'

interface BuildContextOptions {
  origin?: string
}

export async function buildSiteContext(options: BuildContextOptions = {}): Promise<string> {
  const projectRoot = process.cwd()
  const appDir = path.join(projectRoot, 'Frontend', 'CEM-Frontend', 'app')
  const libDir = path.join(projectRoot, 'Frontend', 'CEM-Frontend', 'lib')

  // Determine a single environment-aware base URL
  const origin = options.origin || ''
  const preferredBaseUrl = origin.includes('localhost:3000')
    ? 'http://localhost:3000'
    : 'https://cem.vercel.app'

  const routes = await collectRoutes(appDir)
  const services = await summarizeServices(libDir)

  const lines: string[] = []
  lines.push('# 🏢 CEM SYSTEM - COMPREHENSIVE CUSTOMER KNOWLEDGE BASE')
  lines.push('')
  lines.push('## 📋 SYSTEM OVERVIEW')
  lines.push('CEM (Customer Equipment Management) is a comprehensive system for managing customer equipment, contracts, and service requests.')
  lines.push('This system is owned by CÔNG TY TNHH KINH DOANH XUẤT NHẬP KHẨU TM VÀ SX THÀNH ĐẠT (Tax Code: 0901108513)')
  lines.push('')
  
  lines.push('## 🌐 BASE URL')
  lines.push(`- Base URL: ${preferredBaseUrl}`)
  lines.push('')
  
  lines.push('## 🎯 CUSTOMER ROLE CAPABILITIES')
  lines.push('As a CUSTOMER in the CEM system, you have access to the following functionalities:')
  lines.push('')
  
  // Add comprehensive customer functionality guide (single-env links)
  lines.push(...generateCustomerFunctionalityGuide(preferredBaseUrl))
  
  lines.push('')
  lines.push('## 🗺️ SYSTEM NAVIGATION MAP')
  lines.push('Available routes and their purposes:')
  for (const route of routes) {
    const link = `${preferredBaseUrl}${route}`
    lines.push(`- ${route} (link: ${link})`)
  }
  
  lines.push('')
  lines.push('## 🔧 SYSTEM SERVICES AND FEATURES')
  lines.push('Key features and services available:')
  for (const s of services) {
    lines.push(`- ${s}`)
  }
  
  lines.push('')
  lines.push('## 🚀 CUSTOMER ONBOARDING GUIDE')
  lines.push('Complete step-by-step guide for new customers to get started:')
  lines.push('')
  
  // Add onboarding guide entries
  for (const [key, onboarding] of Object.entries(CUSTOMER_ONBOARDING)) {
    lines.push(`### ${onboarding.title}`)
    lines.push(onboarding.description)
    lines.push('')
    lines.push('**Steps:**')
    for (const step of onboarding.steps) {
      lines.push(`${step.step}. **${step.title}**: ${step.description}`)
      lines.push(`   - **Action**: ${step.action}`)
      lines.push(`   - **Details**: ${step.details}`)
      lines.push('')
    }
    if (onboarding.tips && onboarding.tips.length > 0) {
      lines.push('**Tips:**')
      for (const tip of onboarding.tips) {
        lines.push(`- ${tip}`)
      }
      lines.push('')
    }
  }
  
  lines.push('')
  lines.push('## 🎭 REAL-WORLD CUSTOMER SCENARIOS')
  lines.push('Common customer situations and step-by-step solutions:')
  lines.push('')
  
  // Add customer scenario entries
  for (const [key, scenario] of Object.entries(CUSTOMER_SCENARIOS)) {
    lines.push(`### ${scenario.title}`)
    lines.push(`**Description**: ${scenario.description}`)
    lines.push(`**Scenario**: ${scenario.scenario}`)
    lines.push('')
    lines.push('**Solution Steps:**')
    for (const step of scenario.steps) {
      lines.push(`${step.step}. **${step.action}**`)
      lines.push(`   - **What to do**: ${step.details}`)
      lines.push(`   - **Where to go**: ${step.url.startsWith('http') ? step.url : preferredBaseUrl + step.url}`)
      lines.push(`   - **Why this helps**: ${step.explanation}`)
      lines.push('')
    }
    if (scenario.tips && scenario.tips.length > 0) {
      lines.push('**Pro Tips:**')
      for (const tip of scenario.tips) {
        lines.push(`- ${tip}`)
      }
      lines.push('')
    }
  }
  
  lines.push('## 📚 CUSTOMER SUPPORT GUIDELINES')
  lines.push('When assisting customers:')
  lines.push('1. Always provide step-by-step instructions')
  lines.push('2. Include a single environment-specific link based on the Base URL above')
  lines.push('3. Explain what information they can view and manage')
  lines.push('4. Guide them through any processes they need to complete')
  lines.push('5. Be specific about their permissions and limitations')
  lines.push('6. Use only the Base URL for all links (do not show both dev and prod)')
  lines.push('7. Reference the onboarding guide for new customers')
  lines.push('8. Use FAQ answers for common questions')
  lines.push('9. Apply relevant scenarios for real-world situations')
  lines.push('')
  lines.push('## 🚫 CUSTOMER LIMITATIONS')
  lines.push('Customers CANNOT:')
  lines.push('- Access other customers\' information')
  lines.push('- Modify system configurations')
  lines.push('- Access admin or staff functions')
  lines.push('- View internal company reports')
  lines.push('- Manage other users\' accounts')
  
  lines.push('')
  lines.push('## ❓ FREQUENTLY ASKED QUESTIONS (FAQ)')
  lines.push('Common customer questions and detailed answers:')
  lines.push('')
  
  // Add FAQ entries
  for (const [key, faq] of Object.entries(CUSTOMER_FAQ)) {
    lines.push(`### ${faq.question}`)
    lines.push(faq.answer)
    lines.push('')
  }
  
  lines.push('## 🔍 FAQ SEARCH FUNCTIONALITY')
  lines.push('The system includes intelligent FAQ search that can:')
  lines.push('- Find relevant answers based on keywords')
  lines.push('- Provide step-by-step solutions')
  lines.push('- Match user queries to specific topics')
  lines.push('- Offer contextual help for any customer question')
  lines.push('')
  lines.push('## 💡 PROACTIVE CUSTOMER SUPPORT')
  lines.push('As an AI assistant, you should:')
  lines.push('1. **Anticipate needs**: Suggest relevant features based on context')
  lines.push('2. **Provide context**: Explain why features exist and how they help')
  lines.push('3. **Offer alternatives**: If one approach doesn\'t work, suggest others')
  lines.push('4. **Follow up**: Ask if customers need clarification or have other questions')
  lines.push('5. **Be educational**: Help customers understand the system better')
  lines.push('6. **Stay current**: Always use the most up-to-date information from this context')
  lines.push('7. **Guide new customers**: Use onboarding guide for first-time users')
  lines.push('8. **Reference FAQs**: Use FAQ answers for common questions')
  lines.push('9. **Apply scenarios**: Use relevant scenarios for real-world situations')
  lines.push('')
  lines.push('## 🎓 CUSTOMER EDUCATION STRATEGY')
  lines.push('Help customers become confident CEM system users by:')
  lines.push('1. **Starting with basics**: Use onboarding guide for new customers')
  lines.push('2. **Building confidence**: Provide step-by-step guidance for every task')
  lines.push('3. **Explaining benefits**: Show how features help them manage their equipment')
  lines.push('4. **Encouraging exploration**: Guide them to discover useful features')
  lines.push('5. **Providing context**: Explain why certain information is important')
  lines.push('6. **Offering practice**: Suggest simple tasks to build familiarity')
  lines.push('7. **Following up**: Check if they need help with next steps')
  lines.push('8. **Using scenarios**: Apply real-world examples to their situations')
  lines.push('')
  lines.push('## 🎯 SCENARIO-BASED ASSISTANCE')
  lines.push('When customers describe problems or needs:')
  lines.push('1. **Identify the scenario**: Match their situation to relevant scenarios')
  lines.push('2. **Provide step-by-step solution**: Use the exact steps from the scenario')
  lines.push('3. **Include direct links**: Use the URLs provided in the scenario (single environment only)')
  lines.push('4. **Explain each step**: Help them understand why each action is important')
  lines.push('5. **Offer pro tips**: Share the tips and best practices from the scenario')
  lines.push('6. **Follow up**: Ensure they can complete the process successfully')
  lines.push('')
  lines.push('## ✅ CANONICAL WORKFLOWS (DO NOT DEVIATE)')
  lines.push('- Service Request creation: My Devices → Select Device → Request Support → Choose Maintenance/Warranty → Fill form → Submit')
  lines.push('- Digital Contract Signing: Contracts → Open contract awaiting your signature → Sign Contract → Place signature → Submit → Verify status')

  return lines.join('\n')
}

function generateCustomerFunctionalityGuide(baseUrl: string): string[] {
  const lines: string[] = []
  
  lines.push('### 🔑 **1. AUTHENTICATION & LOGIN**')
  lines.push('**Purpose**: Access the CEM system with your customer account')
  lines.push('**Steps**:')
  lines.push('1. Navigate to the login page')
  lines.push('2. Enter your registered email address')
  lines.push('3. Enter your password')
  lines.push('4. Click "Login" or press Enter')
  lines.push('**Link**:')
  lines.push(`- ${baseUrl}/login`)
  lines.push('')
  
  lines.push('### 🏠 **2. DASHBOARD OVERVIEW**')
  lines.push('**Purpose**: View your personal overview, statistics, and quick access to main functions')
  lines.push('**What you can see**:')
  lines.push('- Total number of devices you own')
  lines.push('- Active contracts count')
  lines.push('- Pending service requests')
  lines.push('- Recent activity summary')
  lines.push('**Link**:')
  lines.push(`- ${baseUrl}/dashboard`)
  lines.push('')
  
  lines.push('### 👤 **3. PERSONAL PROFILE MANAGEMENT**')
  lines.push('**Purpose**: View and manage your personal information and company details')
  lines.push('**What you can view**:')
  lines.push('- Personal details (name, email, phone)')
  lines.push('- Company information')
  lines.push('- Tax identification number')
  lines.push('- Legal representative details')
  lines.push('- ID card/passport information')
  lines.push('**Link**:')
  lines.push(`- ${baseUrl}/profile`)
  lines.push('')
  
  lines.push('### 🔐 **4. PASSWORD MANAGEMENT**')
  lines.push('**Purpose**: Change your account password for security')
  lines.push('**Steps to change password**:')
  lines.push('1. Go to your profile page')
  lines.push('2. Click "Change Password" button')
  lines.push('3. Enter your current password')
  lines.push('4. Enter your new password')
  lines.push('5. Confirm your new password')
  lines.push('6. Click "Update Password"')
  lines.push('**Link**:')
  lines.push(`- ${baseUrl}/profile/change-password`)
  lines.push('')
  
  lines.push('### 📱 **5. DEVICE MANAGEMENT & MONITORING**')
  lines.push('**Purpose**: View all devices you own, their status, warranty information, and maintenance history')
  lines.push('**What you can see**:')
  lines.push('- Complete list of your devices')
  lines.push('- Device specifications and model information')
  lines.push('- Serial numbers and unique identifiers')
  lines.push('- Purchase dates and warranty expiration')
  lines.push('- Current device status (Active, Inactive, Error, etc.)')
  lines.push('- Warranty status and expiration warnings')
  lines.push('- Technical notes and maintenance history')
  lines.push('**Links**:')
  lines.push(`- ${baseUrl}/my-devices (create service requests from device)`) 
  lines.push(`- ${baseUrl}/service-requests (track requests)`) 
  lines.push('')
  
  lines.push('### 📄 **6. CONTRACT MANAGEMENT & VIEWING**')
  lines.push('**Purpose**: View all contracts you have signed, their status, and payment information')
  lines.push('**What you can see**:')
  lines.push('- Contract numbers and titles')
  lines.push('- Contract values and payment terms')
  lines.push('- Start and end dates')
  lines.push('- Contract status (Active, Draft, Pending, etc.)')
  lines.push('- Detailed service descriptions')
  lines.push('- Payment schedules and methods')
  lines.push('- Delivery schedules and locations')
  lines.push('- Warranty terms and conditions')
  lines.push('**What you can do**:')
  lines.push('- View contract details and terms')
  lines.push('- Check payment status and schedules')
  lines.push('- Review delivery information')
  lines.push('- Access contract documents')
  lines.push('- View digital signatures and verification status')
  lines.push('- Sign contracts electronically when pending your signature')
  lines.push('**Link**:')
  lines.push(`- ${baseUrl}/contracts`)
  lines.push('')
  
  lines.push('### 🛠️ **7. SERVICE REQUEST MANAGEMENT**')
  lines.push('**Purpose**: Create, view, and track maintenance and warranty service requests for your devices')
  lines.push('**Types of service requests**:')
  lines.push('- **Maintenance Requests**: For regular maintenance, repairs, or upgrades')
  lines.push('- **Warranty Requests**: For warranty-covered repairs or replacements')
  lines.push('**What you can do**:')
  lines.push('- Create new service requests from a specific device')
  lines.push('- Add comments and additional information')
  lines.push('- Upload attachments (photos, documents)')
  lines.push('- Track request progress')
  lines.push('- View service history')
  lines.push('**Steps to create a service request (canonical flow)**:')
  lines.push('1. Go to My Devices page')
  lines.push('2. Select the device that needs support')
  lines.push('3. Click "Request Support" on that device')
  lines.push('4. Choose request type: Maintenance or Warranty')
  lines.push('5. Fill in the required fields (description, preferred time, attachments)')
  lines.push('6. Submit the request')
  lines.push('**Links**:')
  lines.push(`- ${baseUrl}/my-devices (create) | ${baseUrl}/service-requests (track)`) 
  lines.push('')
  
  lines.push('### 💬 **8. AI CHAT SUPPORT**')
  lines.push('**Purpose**: Get instant help and guidance from AI assistant for any system-related questions')
  lines.push('**Features**:')
  lines.push('- 24/7 availability')
  lines.push('- Instant responses')
  lines.push('- Direct navigation links')
  lines.push('- Step-by-step instructions')
  lines.push('- Context-aware assistance')
  lines.push('')
  
  lines.push('### 📊 **9. DATA FILTERING & SEARCH**')
  lines.push('**Purpose**: Efficiently find specific information across all your data')
  lines.push('**Search capabilities**:')
  lines.push('- **Devices**: Search by name, model, serial number, or status')
  lines.push('- **Contracts**: Search by contract number, title, or status')
  lines.push('- **Service Requests**: Search by request ID, device, or status')
  lines.push('')
  
  lines.push('### 📱 **10. MOBILE RESPONSIVENESS**')
  lines.push('**Purpose**: Access all functions from mobile devices and tablets')
  lines.push('')
  
  lines.push('### 🔔 **11. NOTIFICATIONS & UPDATES**')
  lines.push('**Purpose**: Stay informed about important updates and changes')
  lines.push('')
  
  lines.push('### 🆘 **12. TROUBLESHOOTING & HELP**')
  lines.push('**Purpose**: Resolve common issues and get help when needed')
  lines.push('')
  
  lines.push('### 🔒 **13. SECURITY & PRIVACY**')
  lines.push('**Purpose**: Understand how your data is protected and your privacy maintained')
  
  return lines
}

// Export the FAQ, onboarding, and scenario search functions for use in other parts of the system
export { findRelevantFAQ, findRelevantOnboarding, findRelevantScenarios }

async function collectRoutes(appDir: string): Promise<string[]> {
  const routes: string[] = []
  try {
    const files = await walk(appDir)
    const pageFiles = files.filter(f => f.endsWith(`${path.sep}page.tsx`))
    for (const full of pageFiles) {
      const rel = full.substring(appDir.length).replace(/\\/g, '/') // normalize
      let route = rel.replace(/\/page\.tsx$/, '')
      route = route === '' ? '/' : route
      // Convert filesystem segments to URL segments
      route = route
        .replace(/\/(layout|components)(\/|$)/g, '/')
        .replace(/\/$/, '')
      if (!route.startsWith('/')) route = '/' + route
      routes.push(route)
    }
    // Deduplicate and sort by length then alpha for readability
    return Array.from(new Set(routes)).sort((a, b) => a.length - b.length || a.localeCompare(b))
  } catch {
    return []
  }
}

async function summarizeServices(libDir: string): Promise<string[]> {
  const summaries: string[] = []
  try {
    const files = await walk(libDir)
    const serviceFiles = files.filter(f => /service(?!-worker)\.ts$/.test(f) || /-service\.ts$/.test(f))
    for (const full of serviceFiles) {
      const rel = full.substring(libDir.length).replace(/\\/g, '/')
      const content = await safeRead(full)
      const exports = Array.from(content.matchAll(/export\s+(async\s+)?function\s+(\w+)/g)).map(m => m[2])
      const title = rel.replace(/^\//, '')
      if (exports.length > 0) summaries.push(`${title}: ${exports.join(', ')}`)
      else summaries.push(title)
    }
  } catch {}
  return summaries
}

async function walk(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(dirents.map(async (d) => {
    const res = path.resolve(dir, d.name)
    if (d.isDirectory()) return walk(res)
    return [res]
  }))
  return files.flat()
}

async function safeRead(file: string): Promise<string> {
  try { return await fs.readFile(file, 'utf8') } catch { return '' }
}


