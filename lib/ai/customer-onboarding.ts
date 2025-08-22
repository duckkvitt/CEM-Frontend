// Comprehensive Customer Onboarding Guide for CEM System
// This file provides step-by-step guidance for new customers to get started

export const CUSTOMER_ONBOARDING = {
  // First Time Setup
  'first-login': {
    title: '🎯 First Time Login & Setup',
    description: 'Complete guide for your first time accessing the CEM system',
    steps: [
      {
        step: 1,
        title: 'Access the Login Page',
        description: 'Navigate to the CEM system login page',
        action: 'Go to the login page using the provided URL',
        details: 'You\'ll need your email address and temporary password provided by the CEM team'
      },
      {
        step: 2,
        title: 'Enter Your Credentials',
        description: 'Use your provided login information',
        action: 'Enter your email address and temporary password',
        details: 'Make sure to use the exact email address provided by the CEM team'
      },
      {
        step: 3,
        title: 'Complete First Login',
        description: 'Access the system for the first time',
        action: 'Click "Login" to enter the system',
        details: 'You\'ll be automatically redirected to your dashboard after successful login'
      },
      {
        step: 4,
        title: 'Change Your Password',
        description: 'Set a secure password for your account',
        action: 'Navigate to Profile → Change Password',
        details: 'Create a strong, unique password that you\'ll remember'
      }
    ],
    tips: [
      'Keep your login credentials secure and don\'t share them',
      'Use a password manager if you have trouble remembering passwords',
      'Contact support immediately if you can\'t access your account'
    ]
  },

  // Dashboard Orientation
  'dashboard-orientation': {
    title: '🏠 Dashboard Orientation',
    description: 'Learn how to navigate and understand your dashboard',
    steps: [
      {
        step: 1,
        title: 'Explore Dashboard Overview',
        description: 'Understand what information is displayed',
        action: 'Review the dashboard sections and statistics',
        details: 'Your dashboard shows device count, active contracts, and pending service requests'
      },
      {
        step: 2,
        title: 'Navigate Main Menu',
        description: 'Learn the main navigation structure',
        action: 'Click through each main menu item to see what\'s available',
        details: 'Main sections include: Dashboard, Profile, My Devices, Contracts, Service Requests'
      },
      {
        step: 3,
        title: 'Check Notifications',
        description: 'Review any important system notifications',
        action: 'Look for notification indicators on the dashboard',
        details: 'Notifications may include warranty alerts, contract updates, or system announcements'
      },
      {
        step: 4,
        title: 'Customize Your View',
        description: 'Adjust dashboard to your preferences',
        action: 'Explore dashboard settings and customization options',
        details: 'You can arrange widgets and choose what information to display prominently'
      }
    ],
    tips: [
      'Visit your dashboard regularly to stay updated on your account',
      'Use the dashboard as your central hub for all CEM activities',
      'Pay attention to notifications and alerts'
    ]
  },

  // Profile Setup
  'profile-setup': {
    title: '👤 Complete Your Profile',
    description: 'Set up your personal and company information',
    steps: [
      {
        step: 1,
        title: 'Access Profile Section',
        description: 'Navigate to your profile page',
        action: 'Click on your name/profile picture → Profile',
        details: 'This is where you\'ll manage all your personal information'
      },
      {
        step: 2,
        title: 'Verify Personal Information',
        description: 'Check and update your personal details',
        action: 'Review your name, email, and phone number',
        details: 'Ensure all contact information is current and accurate'
      },
      {
        step: 3,
        title: 'Complete Company Information',
        description: 'Fill in your company details',
        action: 'Update company name, address, and tax information',
        details: 'This information is used for contracts and official communications'
      },
      {
        step: 4,
        title: 'Save Your Changes',
        description: 'Ensure all information is saved',
        action: 'Click "Save Changes" after making updates',
        details: 'Your profile will be updated immediately across the system'
      }
    ],
    tips: [
      'Keep your profile information current for accurate contract processing',
      'Double-check all information before saving',
      'Update your profile whenever company information changes'
    ]
  },

  // Device Discovery
  'device-discovery': {
    title: '📱 Discover Your Devices',
    description: 'Learn how to view and understand your equipment',
    steps: [
      {
        step: 1,
        title: 'Navigate to My Devices',
        description: 'Access your device management page',
        action: 'Click "My Devices" in the main navigation',
        details: 'This page shows all equipment associated with your account'
      },
      {
        step: 2,
        title: 'Review Device List',
        description: 'See all your devices at a glance',
        action: 'Scroll through your device list to see what\'s available',
        details: 'Each device shows basic information like name, model, and status'
      },
      {
        step: 3,
        title: 'Understand Device Status',
        description: 'Learn what different statuses mean',
        action: 'Review the status column for each device',
        details: 'Statuses include: Active, Inactive, Error, Warranty, Expired'
      },
      {
        step: 4,
        title: 'Explore Device Details',
        description: 'Click on devices for more information',
        action: 'Click on any device row to see detailed information',
        details: 'Detailed view shows specifications, warranty info, and maintenance history'
      }
    ],
    tips: [
      'Use the search function to quickly find specific devices',
      'Filter devices by status to identify which ones need attention',
      'Check warranty expiration dates regularly'
    ]
  },

  // Contract Review
  'contract-review': {
    title: '📄 Review Your Contracts',
    description: 'Understand your existing contracts and agreements',
    steps: [
      {
        step: 1,
        title: 'Access Contracts Page',
        description: 'Navigate to your contracts section',
        action: 'Click "Contracts" in the main navigation',
        details: 'This shows all contracts associated with your account'
      },
      {
        step: 2,
        title: 'Review Contract List',
        description: 'See all your contracts at once',
        action: 'Browse through your contract list',
        details: 'Each contract shows number, title, value, and status'
      },
      {
        step: 3,
        title: 'Understand Contract Status',
        description: 'Learn what different contract statuses mean',
        action: 'Use the status tabs to filter contracts',
        details: 'Tabs include: Unsigned, Signed, and Hidden contracts'
      },
      {
        step: 4,
        title: 'Examine Contract Details',
        description: 'Click on contracts for full information',
        action: 'Click on any contract to view complete details',
        details: 'Detailed view shows terms, payment info, delivery schedules, and warranty'
      }
    ],
    tips: [
      'Keep track of contract expiration dates',
      'Review payment schedules and terms regularly',
      'Contact support if you have questions about contract terms'
    ]
  },

  // Electronic Contract Signing (new)
  'contract-signing': {
    title: '🖊️ Sign a Contract Electronically',
    description: 'Learn how to sign contracts digitally within the system',
    steps: [
      {
        step: 1,
        title: 'Open Contracts Page',
        description: 'Navigate to the contracts section',
        action: 'Click "Contracts" in the main navigation',
        details: 'Locate contracts that are pending your signature'
      },
      {
        step: 2,
        title: 'Open Contract Detail',
        description: 'View the specific contract you need to sign',
        action: 'Click on the contract from the list to open details',
        details: 'Verify terms, pricing, and delivery information before signing'
      },
      {
        step: 3,
        title: 'Start Signing',
        description: 'Initiate the digital signing process',
        action: 'Click "Sign Contract" or the signature action in the viewer',
        details: 'Make sure your signer role is Customer if prompted'
      },
      {
        step: 4,
        title: 'Place Your Signature',
        description: 'Draw or confirm your signature on the document',
        action: 'Use the signature canvas to create your signature',
        details: 'Adjust position and size if allowed; ensure it is placed in the designated area'
      },
      {
        step: 5,
        title: 'Confirm and Submit',
        description: 'Complete the signing process',
        action: 'Confirm the signature and submit for processing',
        details: 'Wait for confirmation and status update to Signed'
      },
      {
        step: 6,
        title: 'Verify Signature Record',
        description: 'Ensure your signature is recorded',
        action: 'Check the signature record and verification status in the contract detail',
        details: 'You should see signer name, time, and verification information'
      }
    ],
    tips: [
      'Review all contract terms carefully before signing',
      'Ensure your name and email are correct before submitting',
      'If the button is disabled, check that the contract is pending your signature'
    ]
  },

  // Service Request Creation (canonical)
  'first-service-request': {
    title: '🛠️ Create Your First Service Request',
    description: 'Learn how to request maintenance or warranty service (canonical flow)',
    steps: [
      {
        step: 1,
        title: 'Navigate to My Devices',
        description: 'Access the service entry point',
        action: 'Click "My Devices" in the main navigation',
        details: 'Service requests start from a specific device you own'
      },
      {
        step: 2,
        title: 'Select the Device',
        description: 'Choose which device needs support',
        action: 'Find and select the device in your devices list',
        details: 'You can use search and filters to locate the device faster'
      },
      {
        step: 3,
        title: 'Request Support',
        description: 'Start a new request for the selected device',
        action: 'Click the "Request Support" action on that device',
        details: 'This opens the correct form with the device preselected'
      },
      {
        step: 4,
        title: 'Choose Request Type',
        description: 'Select Maintenance or Warranty',
        action: 'Pick the appropriate type for your issue',
        details: 'Warranty is for covered issues; Maintenance is for regular service or repairs'
      },
      {
        step: 5,
        title: 'Fill Out the Form',
        description: 'Provide detailed information',
        action: 'Enter description, preferred time, and add attachments if needed',
        details: 'The more detail you provide, the faster we can help'
      },
      {
        step: 6,
        title: 'Submit and Track',
        description: 'Send the request and monitor progress',
        action: 'Submit the form, then track it in Service Requests',
        details: 'Use the Service Requests page to see status and updates'
      }
    ],
    tips: [
      'Always initiate requests from My Devices so the device context is accurate',
      'Add clear photos or videos for faster troubleshooting',
      'Set realistic preferred appointment times'
    ]
  },

  // Search and Navigation
  'search-navigation': {
    title: '🔍 Master Search and Navigation',
    description: 'Learn efficient ways to find information in the system',
    steps: [
      {
        step: 1,
        title: 'Practice Basic Search',
        description: 'Learn how to search for specific items',
        action: 'Use search bars on different pages',
        details: 'Search works on devices, contracts, and service requests'
      },
      {
        step: 2,
        title: 'Use Filters Effectively',
        description: 'Narrow down results with filters',
        action: 'Experiment with different filter options',
        details: 'Filters help you find exactly what you\'re looking for'
      },
      {
        step: 3,
        title: 'Navigate Between Pages',
        description: 'Learn to move between different sections',
        action: 'Use the main navigation menu and breadcrumbs',
        details: 'The system is designed for intuitive navigation'
      },
      {
        step: 4,
        title: 'Bookmark Important Pages',
        description: 'Save frequently used pages',
        action: 'Bookmark important pages in your browser',
        details: 'This gives you quick access to commonly used features'
      }
    ],
    tips: [
      'Use specific keywords when searching for better results',
      'Combine search terms with filters for precise results',
      'Learn keyboard shortcuts for faster navigation'
    ]
  },

  // Mobile Usage
  'mobile-setup': {
    title: '📱 Set Up Mobile Access',
    description: 'Configure and optimize mobile access to the system',
    steps: [
      {
        step: 1,
        title: 'Test Mobile Access',
        description: 'Verify the system works on your mobile device',
        action: 'Open the CEM system on your smartphone or tablet',
        details: 'The system is fully responsive and mobile-optimized'
      },
      {
        step: 2,
        title: 'Optimize Mobile View',
        description: 'Adjust settings for best mobile experience',
        action: 'Use landscape orientation for better viewing',
        details: 'Some features work better in landscape mode'
      },
      {
        step: 3,
        title: 'Test Key Functions',
        description: 'Ensure important features work on mobile',
        action: 'Test navigation, search, and basic functions',
        details: 'All customer functions are available on mobile devices'
      },
      {
        step: 4,
        title: 'Set Up Notifications',
        description: 'Configure mobile notifications if available',
        action: 'Check notification settings in your mobile browser',
        details: 'Stay updated even when away from your computer'
      }
    ],
    tips: [
      'Use mobile for quick checks and basic operations',
      'Use desktop for complex tasks and detailed work',
      'Keep your mobile browser updated for best performance'
    ]
  },

  // Support Resources
  'support-resources': {
    title: '🆘 Learn About Support Resources',
    description: 'Discover all the ways to get help when you need it',
    steps: [
      {
        step: 1,
        title: 'Find AI Chat Assistant',
        description: 'Locate the AI chat feature',
        action: 'Look for the chat bubble icon (💬) in the bottom-right corner',
        details: 'This is your 24/7 AI assistant for immediate help'
      },
      {
        step: 2,
        title: 'Test AI Chat',
        description: 'Try asking the AI assistant a question',
        action: 'Click the chat bubble and ask a simple question',
        details: 'The AI can help with navigation, features, and troubleshooting'
      },
      {
        step: 3,
        title: 'Explore Help Documentation',
        description: 'Find built-in help resources',
        action: 'Look for help links and documentation throughout the system',
        details: 'Many pages have contextual help and explanations'
      },
      {
        step: 4,
        title: 'Know When to Contact Support',
        description: 'Understand when to reach out to human support',
        action: 'Use AI chat first, then contact support if needed',
        details: 'Support team handles complex issues and account problems'
      }
    ],
    tips: [
      'AI chat is available 24/7 for immediate assistance',
      'Try AI chat before contacting human support',
      'Keep support contact information handy for emergencies'
    ]
  },

  // Best Practices
  'best-practices': {
    title: '💡 Best Practices for CEM System',
    description: 'Learn how to use the system most effectively',
    steps: [
      {
        step: 1,
        title: 'Regular System Check-ins',
        description: 'Establish a routine for checking your account',
        action: 'Set aside time weekly to review your dashboard',
        details: 'Regular check-ins help you stay on top of important updates'
      },
      {
        step: 2,
        title: 'Keep Information Current',
        description: 'Maintain accurate and up-to-date information',
        action: 'Update your profile and contact information regularly',
        details: 'Current information ensures smooth contract and service processes'
      },
      {
        step: 3,
        title: 'Monitor Device Status',
        description: 'Stay aware of your equipment condition',
        action: 'Check device status and warranty information regularly',
        details: 'Proactive monitoring helps prevent issues and plan maintenance'
      },
      {
        step: 4,
        title: 'Use Search and Filters',
        description: 'Master efficient information finding',
        action: 'Practice using search and filter functions regularly',
        details: 'Efficient searching saves time and helps you find what you need quickly'
      }
    ],
    tips: [
      'Bookmark frequently used pages in your browser',
      'Use the AI chat for quick questions and guidance',
      'Keep a record of important contract numbers and device information',
      'Set reminders for warranty expiration dates'
    ]
  }
}

// Helper function to get onboarding steps for a specific topic
export function getOnboardingSteps(topic: string) {
  return CUSTOMER_ONBOARDING[topic as keyof typeof CUSTOMER_ONBOARDING] || null
}

// Helper function to get all onboarding topics
export function getAllOnboardingTopics() {
  return Object.keys(CUSTOMER_ONBOARDING).map(key => ({
    key,
    ...CUSTOMER_ONBOARDING[key as keyof typeof CUSTOMER_ONBOARDING]
  }))
}

// Helper function to find relevant onboarding topics based on user query
export function findRelevantOnboarding(userQuery: string): Array<{key: string, title: string, description: string, relevance: number}> {
  const query = userQuery.toLowerCase()
  const results: Array<{key: string, title: string, description: string, relevance: number}> = []
  
  for (const [key, onboarding] of Object.entries(CUSTOMER_ONBOARDING)) {
    let relevance = 0
    
    // Check if query matches title or description
    if (query.includes(onboarding.title.toLowerCase())) {
      relevance += 3
    }
    
    if (query.includes(onboarding.description.toLowerCase())) {
      relevance += 2
    }
    
    // Check if query matches step content
    for (const step of onboarding.steps) {
      if (query.includes(step.title.toLowerCase()) || query.includes(step.description.toLowerCase())) {
        relevance += 1
      }
    }
    
    if (relevance > 0) {
      results.push({
        key,
        title: onboarding.title,
        description: onboarding.description,
        relevance
      })
    }
  }
  
  // Sort by relevance (highest first)
  return results.sort((a, b) => b.relevance - a.relevance)
}

export default CUSTOMER_ONBOARDING
