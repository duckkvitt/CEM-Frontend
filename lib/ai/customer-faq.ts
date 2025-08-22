// Comprehensive Customer FAQ for CEM System
// This file provides detailed answers to common customer questions and scenarios

export const CUSTOMER_FAQ = {
  // Authentication & Access
  'login': {
    question: 'How do I log into the CEM system?',
    answer: 'To log into the CEM system, follow these steps:\n\n1. Navigate to the login page\n2. Enter your registered email address\n3. Enter your password\n4. Click "Login" or press Enter\n\nIf you forgot your password, you can use the "Forgot Password" link to reset it.',
    keywords: ['login', 'sign in', 'access', 'authentication', 'password']
  },
  
  'forgot-password': {
    question: 'I forgot my password. How can I reset it?',
    answer: 'To reset your password:\n\n1. Go to the login page\n2. Click "Forgot Password" link\n3. Enter your registered email address\n4. Check your email for password reset instructions\n5. Follow the link in the email to create a new password\n6. Log in with your new password',
    keywords: ['forgot password', 'reset password', 'password recovery', 'lost password']
  },
  
  // Dashboard
  'dashboard': {
    question: 'What can I see on my dashboard?',
    answer: 'Your dashboard provides a comprehensive overview of your CEM account:\n\n• Total number of devices you own\n• Active contracts count\n• Pending service requests\n• Recent activity summary\n• Quick access to main functions\n• System notifications and alerts\n\nThis gives you a quick snapshot of your account status and any actions you need to take.',
    keywords: ['dashboard', 'overview', 'summary', 'home page', 'main page']
  },
  
  // Profile Management
  'profile': {
    question: 'How do I update my profile information?',
    answer: 'To update your profile information:\n\n1. Click on your profile picture/name in the top navigation\n2. Select "Profile" from the dropdown menu\n3. Click "Edit Profile" button\n4. Update the information you want to change\n5. Click "Save Changes"\n\nYou can update:\n• Personal contact information\n• Company address\n• Phone numbers\n• Email preferences',
    keywords: ['profile', 'edit profile', 'update information', 'personal details', 'company info']
  },
  
  'change-password': {
    question: 'How do I change my password?',
    answer: 'To change your password:\n\n1. Go to your profile page\n2. Click "Change Password" button\n3. Enter your current password\n4. Enter your new password\n5. Confirm your new password\n6. Click "Update Password"\n\nMake sure your new password is strong and unique for security.',
    keywords: ['change password', 'update password', 'new password', 'password security']
  },
  
  // Device Management
  'view-devices': {
    question: 'How do I view all my devices?',
    answer: 'To view all your devices:\n\n1. Click "My Devices" in the main navigation\n2. Or navigate directly to the devices page\n\nYou\'ll see:\n• Complete list of all devices you own\n• Device specifications and model information\n• Serial numbers and unique identifiers\n• Purchase dates and warranty expiration\n• Current device status\n• Warranty status and warnings',
    keywords: ['my devices', 'view devices', 'device list', 'equipment', 'hardware']
  },
  
  'device-details': {
    question: 'How do I view detailed information about a specific device?',
    answer: 'To view detailed device information:\n\n1. Go to My Devices page\n2. Use search or filters to find the specific device\n3. Click on the device row to view detailed information\n4. You\'ll see:\n   • Complete device specifications\n   • Warranty status and expiration\n   • Maintenance history\n   • Technical notes\n   • Service request history\n   • Device status updates',
    keywords: ['device details', 'device information', 'device specs', 'warranty info', 'maintenance history']
  },
  
  'device-status': {
    question: 'What do the different device statuses mean?',
    answer: 'Device statuses indicate the current condition of your equipment:\n\n• **Active**: Device is working normally and operational\n• **Inactive**: Device is temporarily not in use\n• **Error**: Device has a technical issue that needs attention\n• **Warranty**: Device is under warranty coverage\n• **Expired**: Device warranty has expired\n\nYou can filter devices by status to quickly identify which ones need attention.',
    keywords: ['device status', 'active', 'inactive', 'error', 'warranty', 'expired']
  },
  
  'warranty-check': {
    question: 'How do I check if my device is still under warranty?',
    answer: 'To check warranty status:\n\n1. Go to My Devices page\n2. Look for the warranty column in your device list\n3. Devices under warranty will show "Warranty" status\n4. Click on any device to see detailed warranty information\n5. You\'ll see:\n   • Warranty start and end dates\n   • Warranty terms and conditions\n   • Coverage details\n   • Expiration warnings',
    keywords: ['warranty', 'warranty status', 'warranty check', 'coverage', 'expiration']
  },
  
  // Contract Management
  'view-contracts': {
    question: 'How do I view my contracts?',
    answer: 'To view your contracts:\n\n1. Click "Contracts" in the main navigation\n2. Or navigate directly to the contracts page\n\nYou\'ll see:\n• Contract numbers and titles\n• Contract values and payment terms\n• Start and end dates\n• Contract status (Active, Draft, Pending, etc.)\n• Detailed service descriptions\n• Payment schedules and methods',
    keywords: ['contracts', 'view contracts', 'agreements', 'contract list', 'contract details']
  },
  
  'contract-details': {
    question: 'How do I view detailed contract information?',
    answer: 'To view detailed contract information:\n\n1. Go to Contracts page\n2. Use tabs to filter by status (Unsigned, Signed, Hidden)\n3. Click on any contract to view full details\n4. You\'ll see:\n   • Complete contract terms\n   • Payment information and schedules\n   • Delivery information\n   • Warranty terms and conditions\n   • Digital signatures and verification status',
    keywords: ['contract details', 'contract terms', 'payment info', 'delivery info', 'warranty terms']
  },

  'contract-signing': {
    question: 'Can I sign contracts electronically in the system? How?',
    answer: 'Yes. The system supports electronic contract signing for customers.\n\nTo sign a contract that is awaiting your signature:\n\n1. Go to Contracts page\n2. Filter or locate the contract pending your signature\n3. Open the contract detail\n4. Click "Sign Contract" (or the signature action in the viewer)\n5. Confirm your signer role (Customer) if prompted\n6. Draw/confirm your signature in the designated area\n7. Submit the signature\n8. Verify the status changes to Signed and the signature record appears',
    keywords: ['sign contract', 'electronic signature', 'e-sign', 'digital signature', 'contract signing']
  },
  
  'contract-status': {
    question: 'What do the different contract statuses mean?',
    answer: 'Contract statuses indicate the current state of your agreements:\n\n• **Draft**: Contract is being prepared\n• **Pending**: Waiting for signatures or approval\n• **Active**: Contract is in effect and operational\n• **Hidden**: Contract is archived or hidden from view\n\nUse the tabs to filter contracts by status and see only the ones you\'re interested in.',
    keywords: ['contract status', 'draft', 'pending', 'active', 'hidden', 'contract state']
  },
  
  // Service Requests (canonical)
  'create-service-request': {
    question: 'How do I create a service request?',
    answer: 'To create a service request (canonical flow):\n\n1. Go to My Devices page\n2. Select the device that needs support\n3. Click "Request Support" on that device\n4. Choose request type (Maintenance or Warranty)\n5. Fill in the required fields (description, preferred time, attachments)\n6. Submit the request\n\nYou\'ll receive confirmation and can track progress in Service Requests.',
    keywords: ['create service request', 'new request', 'maintenance request', 'warranty request', 'service needed']
  },
  
  'service-request-types': {
    question: 'What types of service requests can I create?',
    answer: 'You can create two types of service requests:\n\n**Maintenance Requests**:\n• Regular maintenance and inspections\n• Repairs and upgrades\n• Performance optimization\n• Preventive maintenance\n\n**Warranty Requests**:\n• Warranty-covered repairs\n• Defective part replacements\n• Manufacturing defect fixes\n• Warranty service calls\n\nChoose the type that best matches your needs.',
    keywords: ['service request types', 'maintenance', 'warranty', 'repair', 'service types']
  },
  
  'track-service-request': {
    question: 'How do I track my service request?',
    answer: 'To track your service request:\n\n1. Go to Service Requests page\n2. Use tabs to filter by type (All, Maintenance, Warranty)\n3. Find your request in the list\n4. Click on it to view detailed status\n5. You\'ll see:\n   • Current status updates\n   • Staff notes and progress\n   • Estimated completion times\n   • Cost estimates (if applicable)\n   • Completion history',
    keywords: ['track service request', 'service request status', 'progress tracking', 'status updates']
  },
  
  'service-request-status': {
    question: 'What do the different service request statuses mean?',
    answer: 'Service request statuses show the progress of your request:\n\n• **Pending**: Request submitted, waiting for review\n• **Approved**: Request approved, scheduling in progress\n• **In Progress**: Work has begun on your request\n• **Completed**: Service request has been fulfilled\n• **Rejected**: Request was not approved (with explanation)\n\nCheck your service requests regularly for status updates.',
    keywords: ['service request status', 'pending', 'approved', 'in progress', 'completed', 'rejected']
  },
  
  // Search and Filtering
  'search-devices': {
    question: 'How do I search for specific devices?',
    answer: 'To search for specific devices:\n\n1. Go to My Devices page\n2. Use the search bar at the top\n3. Type any of the following:\n   • Device name or model\n   • Serial number\n   • Device code\n   • Any identifying information\n4. Press Enter or click the search icon\n5. Results will show matching devices\n6. Use additional filters to narrow down results',
    keywords: ['search devices', 'find device', 'device search', 'search by name', 'search by serial']
  },
  
  'filter-devices': {
    question: 'How do I filter devices by status?',
    answer: 'To filter devices by status:\n\n1. Go to My Devices page\n2. Use the status dropdown filter\n3. Select from these options:\n   • **All Status**: Shows all devices\n   • **Active**: Only working devices\n   • **Inactive**: Temporarily unused devices\n   • **Error**: Devices with issues\n   • **Warranty**: Devices under warranty\n   • **Expired**: Devices with expired warranty\n4. Results will update automatically',
    keywords: ['filter devices', 'device filter', 'status filter', 'filter by status', 'device status filter']
  },
  
  'search-contracts': {
    question: 'How do I search for specific contracts?',
    answer: 'To search for specific contracts:\n\n1. Go to Contracts page\n2. Use the search bar at the top\n3. Type any of the following:\n   • Contract number\n   • Contract title\n   • Customer name\n   • Any identifying information\n4. Press Enter or click the search icon\n5. Results will show matching contracts\n6. Use status tabs to further filter results',
    keywords: ['search contracts', 'find contract', 'contract search', 'search by number', 'search by title']
  },
  
  // Troubleshooting
  'cant-login': {
    question: 'I can\'t log into the system. What should I do?',
    answer: 'If you can\'t log in, try these steps:\n\n1. **Check your credentials**:\n   • Verify your email address is correct\n   • Ensure your password is entered correctly\n   • Check if Caps Lock is on\n\n2. **Reset your password**:\n   • Use "Forgot Password" link\n   • Follow email instructions\n   • Create a new strong password\n\n3. **Contact support**:\n   • If problems persist, contact support\n   • Provide your email address for assistance',
    keywords: ['can\'t login', 'login problem', 'access denied', 'login failed', 'authentication error']
  },
  
  'page-not-loading': {
    question: 'A page is not loading properly. What should I do?',
    answer: 'If a page is not loading properly:\n\n1. **Refresh the page**:\n   • Press F5 or Ctrl+R\n   • Or click the refresh button\n\n2. **Check your connection**:\n   • Ensure you have internet access\n   • Try loading other websites\n\n3. **Clear browser cache**:\n   • Clear cookies and cache\n   • Try a different browser\n\n4. **Contact support**:\n   • If problems persist, use AI chat for help\n   • Or contact support team',
    keywords: ['page not loading', 'loading problem', 'page error', 'browser issue', 'loading failed']
  },
  
  'data-not-updating': {
    question: 'My data is not updating. What should I do?',
    answer: 'If your data is not updating:\n\n1. **Refresh the page**:\n   • Press F5 or Ctrl+R\n   • This often resolves display issues\n\n2. **Check your login status**:\n   • Ensure you\'re still logged in\n   • Log out and log back in if needed\n\n3. **Wait a moment**:\n   • Some updates take time to process\n   • Wait a few minutes and check again\n\n4. **Contact support**:\n   • If problems persist, use AI chat\n   • Or contact support team',
    keywords: ['data not updating', 'information not current', 'outdated data', 'sync problem', 'update issue']
  },
  
  // Mobile Usage
  'mobile-access': {
    question: 'Can I access the CEM system from my mobile device?',
    answer: 'Yes! The CEM system is fully mobile-optimized:\n\n**Mobile Features**:\n• Responsive design for all screen sizes\n• Touch-friendly interface elements\n• Mobile-optimized navigation\n• Easy-to-use mobile forms\n• Optimized for mobile browsers\n\n**Best Practices**:\n• Use landscape orientation for better viewing\n• Tap and hold for additional options\n• Use the mobile menu for navigation\n• Zoom in on detailed information when needed\n\nAll functions are available on mobile devices.',
    keywords: ['mobile access', 'mobile device', 'smartphone', 'tablet', 'mobile friendly', 'responsive']
  },
  
  // Notifications
  'notifications': {
    question: 'How do I stay updated about my devices and contracts?',
    answer: 'To stay updated about your account:\n\n1. **Check your dashboard regularly**:\n   • View recent activity\n   • Check for new notifications\n   • Monitor important updates\n\n2. **Review service request updates**:\n   • Check status changes\n   • Read staff notes\n   • Monitor progress\n\n3. **Monitor contract changes**:\n   • Check contract status updates\n   • Review payment reminders\n   • Monitor delivery updates\n\n4. **Use AI chat assistance**:\n   • Get real-time help\n   • Ask about any updates\n   • Get immediate guidance',
    keywords: ['notifications', 'updates', 'stay informed', 'monitor changes', 'activity updates']
  },
  
  // Security
  'security': {
    question: 'How secure is my information in the CEM system?',
    answer: 'Your information is highly secure in the CEM system:\n\n**Security Features**:\n• Secure login with encrypted passwords\n• Session management and automatic logout\n• Data encryption in transit and storage\n• Role-based access control\n• Audit logging of all activities\n\n**Your Privacy Rights**:\n• Access only your own data\n• Update your personal information\n• Request data export\n• Control notification preferences\n\n**Best Practices**:\n• Use a strong, unique password\n• Log out when using shared devices\n• Don\'t share your login credentials\n• Report suspicious activity immediately',
    keywords: ['security', 'privacy', 'data protection', 'secure', 'encryption', 'access control']
  },
  
  // General Help
  'get-help': {
    question: 'How can I get help when I need it?',
    answer: 'There are several ways to get help in the CEM system:\n\n1. **AI Chat Assistant** (Recommended):\n   • Look for the chat bubble icon (💬)\n   • Click to open AI assistant\n   • Ask any question 24/7\n   • Get instant, detailed guidance\n\n2. **Help Documentation**:\n   • Check the help section\n   • Read user guides\n   • Review FAQs\n\n3. **Support Team**:\n   • Create service requests for technical issues\n   • Contact support through official channels\n   • Get human assistance when needed\n\n4. **AI Chat is always available** for immediate help with any question.',
    keywords: ['get help', 'support', 'assistance', 'help needed', 'contact support', 'customer service']
  },
  
  'ai-chat': {
    question: 'How do I use the AI chat assistant?',
    answer: 'The AI chat assistant is your 24/7 help resource:\n\n**How to Access**:\n1. Look for the chat bubble icon (💬) in the bottom-right corner\n2. Click on the chat bubble to open the AI assistant\n3. Type your question or describe what you need help with\n4. The AI will provide detailed guidance and direct links\n5. You can ask follow-up questions for clarification\n\n**What You Can Ask**:\n• How to navigate to specific pages\n• How to perform specific functions\n• Explanation of system features\n• Troubleshooting help\n• Step-by-step guidance for any process\n\n**Features**:\n• 24/7 availability\n• Instant responses\n• Direct navigation links\n• Step-by-step instructions\n• Context-aware assistance',
    keywords: ['AI chat', 'chat assistant', 'AI help', 'chat support', 'virtual assistant', 'AI guidance']
  }
}

// Helper function to find relevant FAQ entries based on user query
export function findRelevantFAQ(userQuery: string): Array<{question: string, answer: string, relevance: number}> {
  const query = userQuery.toLowerCase()
  const results: Array<{question: string, answer: string, relevance: number}> = []
  
  for (const [key, faq] of Object.entries(CUSTOMER_FAQ)) {
    let relevance = 0
    
    // Check if query matches keywords
    for (const keyword of faq.keywords) {
      if (query.includes(keyword.toLowerCase())) {
        relevance += 2
      }
    }
    
    // Check if query matches question or answer
    if (query.includes(faq.question.toLowerCase())) {
      relevance += 3
    }
    
    if (query.includes(faq.answer.toLowerCase())) {
      relevance += 1
    }
    
    if (relevance > 0) {
      results.push({
        question: faq.question,
        answer: faq.answer,
        relevance
      })
    }
  }
  
  // Sort by relevance (highest first)
  return results.sort((a, b) => b.relevance - a.relevance)
}

// Export the FAQ for use in other parts of the system
export default CUSTOMER_FAQ
