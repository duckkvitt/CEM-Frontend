// Comprehensive Customer Scenarios for CEM System
// This file provides real-world examples and use cases for customers

export const CUSTOMER_SCENARIOS = {
  // Device Management Scenarios
  'device-warranty-expiring': {
    title: '🔔 Device Warranty Expiring Soon',
    description: 'Customer needs to check warranty status and plan maintenance',
    scenario: 'A customer notices their device warranty is expiring in 30 days and wants to understand their options.',
    steps: [
      {
        step: 1,
        action: 'Check device warranty status',
        details: 'Navigate to My Devices page and look for warranty expiration warnings',
        url: '/my-devices',
        explanation: 'This helps identify which devices need attention before warranty expires'
      },
      {
        step: 2,
        action: 'Review device details',
        details: 'Click on the device to see warranty terms, coverage details, and expiration date',
        url: '/my-devices',
        explanation: 'Understanding warranty coverage helps plan maintenance and repairs'
      },
      {
        step: 3,
        action: 'Create warranty service request',
        details: 'If issues exist, create a warranty request before expiration',
        url: '/service-requests',
        explanation: 'Warranty requests must be submitted while coverage is still active'
      },
      {
        step: 4,
        action: 'Plan post-warranty maintenance',
        details: 'Consider creating maintenance requests for devices leaving warranty',
        url: '/service-requests',
        explanation: 'Proactive maintenance prevents costly repairs after warranty expires'
      }
    ],
    tips: [
      'Check warranty status monthly to avoid missing expiration dates',
      'Create warranty requests early to ensure timely processing',
      'Consider maintenance contracts for high-value equipment'
    ],
    keywords: ['warranty', 'expiring', 'maintenance', 'device status', 'coverage']
  },

  'device-malfunction': {
    title: '⚠️ Device Malfunction or Error',
    description: 'Customer experiences equipment problems and needs immediate assistance',
    scenario: 'A customer\'s device stops working properly and they need to report the issue and get service.',
    steps: [
      {
        step: 1,
        action: 'Check device status',
        details: 'Go to My Devices to see if the device shows an error status',
        url: '/my-devices',
        explanation: 'Error status indicates the system has detected a problem'
      },
      {
        step: 2,
        action: 'Review device details',
        details: 'Click on the device to see technical notes and recent maintenance history',
        url: '/my-devices',
        explanation: 'Technical notes may contain troubleshooting information'
      },
      {
        step: 3,
        action: 'Request support from the device',
        details: 'On that device, click "Request Support" → choose Maintenance, describe the issue and submit',
        url: '/my-devices',
        explanation: 'Starting from the device ensures the correct context is submitted'
      },
      {
        step: 4,
        action: 'Upload supporting evidence',
        details: 'Include photos, error messages, or documentation of the problem',
        url: '/service-requests',
        explanation: 'Visual evidence helps technicians understand the issue better'
      }
    ],
    tips: [
      'Document the problem with photos and detailed descriptions',
      'Note when the problem first occurred and any recent changes',
      'Set preferred appointment times that work for your schedule'
    ],
    keywords: ['malfunction', 'error', 'broken', 'not working', 'urgent repair']
  },

  'device-maintenance-schedule': {
    title: '📅 Regular Device Maintenance',
    description: 'Customer wants to schedule routine maintenance for their equipment',
    scenario: 'A customer wants to establish a regular maintenance schedule for their devices to prevent problems.',
    steps: [
      {
        step: 1,
        action: 'Review device maintenance history',
        details: 'Check My Devices for maintenance records and recommended schedules',
        url: '/my-devices',
        explanation: 'Understanding maintenance history helps plan future service'
      },
      {
        step: 2,
        action: 'Identify maintenance needs',
        details: 'Look for devices that haven\'t been serviced recently or show maintenance alerts',
        url: '/my-devices',
        explanation: 'Proactive maintenance prevents unexpected breakdowns'
      },
      {
        step: 3,
        action: 'Request maintenance from each device',
        details: 'For devices needing service, click "Request Support" → Maintenance and submit',
        url: '/my-devices',
        explanation: 'This ensures each request is linked to the correct device'
      },
      {
        step: 4,
        action: 'Set up maintenance calendar',
        details: 'Note maintenance dates and set reminders for future service',
        url: '/dashboard',
        explanation: 'Regular maintenance scheduling prevents equipment failures'
      }
    ],
    tips: [
      'Follow manufacturer recommended maintenance schedules',
      'Keep records of all maintenance performed',
      'Plan maintenance during low-usage periods'
    ],
    keywords: ['maintenance', 'schedule', 'routine', 'preventive', 'service']
  },

  // Contract Management Scenarios
  'contract-renewal': {
    title: '📋 Contract Renewal Planning',
    description: 'Customer needs to review expiring contracts and plan renewals',
    scenario: 'A customer has contracts approaching expiration and needs to review terms and plan renewals.',
    steps: [
      {
        step: 1,
        action: 'Review contract expiration dates',
        details: 'Check Contracts page for contracts nearing expiration',
        url: '/contracts',
        explanation: 'Early planning prevents service interruptions'
      },
      {
        step: 2,
        action: 'Review contract terms and performance',
        details: 'Click on contracts to review terms, pricing, and service quality',
        url: '/contracts',
        explanation: 'Understanding current contract performance helps with renewal decisions'
      },
      {
        step: 3,
        action: 'Assess current needs',
        details: 'Evaluate if current contract terms still meet your business needs',
        url: '/dashboard',
        explanation: 'Business needs may have changed since the original contract'
      },
      {
        step: 4,
        action: 'Contact support for renewal',
        details: 'Use service requests or contact support to discuss renewal options',
        url: '/service-requests',
        explanation: 'Early renewal discussions often result in better terms'
      }
    ],
    tips: [
      'Start renewal discussions 60-90 days before expiration',
      'Review contract performance and identify areas for improvement',
      'Consider bundling multiple services for better pricing'
    ],
    keywords: ['contract renewal', 'expiration', 'terms', 'pricing', 'negotiation']
  },

  'contract-payment-issue': {
    title: '💳 Contract Payment Questions',
    description: 'Customer has questions about contract payments or billing',
    scenario: 'A customer needs to understand their payment schedule, review invoices, or resolve billing questions.',
    steps: [
      {
        step: 1,
        action: 'Review contract payment terms',
        details: 'Check contract details for payment schedules and methods',
        url: '/contracts',
        explanation: 'Understanding payment terms prevents late payment issues'
      },
      {
        step: 2,
        action: 'Check payment status',
        details: 'Review contract details for current payment status and history',
        url: '/contracts',
        explanation: 'Payment status shows if accounts are current or past due'
      },
      {
        step: 3,
        action: 'Review billing information',
        details: 'Verify billing address and payment method information',
        url: '/profile',
        explanation: 'Current billing information ensures invoices reach you'
      },
      {
        step: 4,
        action: 'Contact support for billing questions',
        details: 'Use service requests for payment-related questions or disputes',
        url: '/service-requests',
        explanation: 'Support team can help resolve billing and payment issues'
      }
    ],
    tips: [
      'Keep payment information current in your profile',
      'Set up payment reminders to avoid late fees',
      'Contact support immediately for any billing discrepancies'
    ],
    keywords: ['payment', 'billing', 'invoice', 'payment terms', 'billing address']
  },

  // Service Request Scenarios
  'urgent-repair': {
    title: '🚨 Urgent Equipment Repair',
    description: 'Customer needs immediate repair for critical equipment',
    scenario: 'A customer has equipment that is critical to operations and needs immediate repair service.',
    steps: [
      {
        step: 1,
        action: 'Assess urgency level',
        details: 'Determine if the issue affects critical operations or safety',
        url: '/my-devices',
        explanation: 'Understanding urgency helps prioritize service requests'
      },
      {
        step: 2,
        action: 'Request urgent service from the device',
        details: 'On the affected device, click "Request Support" → Maintenance, include "URGENT" in description and submit',
        url: '/my-devices',
        explanation: 'Clear urgency indicators tied to the device help prioritize'
      },
      {
        step: 3,
        action: 'Provide detailed problem description',
        details: 'Include specific symptoms, error messages, and operational impact',
        url: '/service-requests',
        explanation: 'Detailed descriptions help technicians prepare for faster repairs'
      },
      {
        step: 4,
        action: 'Set immediate availability',
        details: 'Indicate immediate availability for service appointments',
        url: '/service-requests',
        explanation: 'Flexible scheduling helps service team respond faster'
      },
      {
        step: 5,
        action: 'Follow up on request',
        details: 'Monitor request status and contact support if no response',
        url: '/service-requests',
        explanation: 'Active follow-up ensures urgent requests receive attention'
      }
    ],
    tips: [
      'Clearly mark urgent requests in the description',
      'Provide contact information for immediate response',
      'Have backup equipment ready if possible'
    ],
    keywords: ['urgent', 'critical', 'immediate', 'emergency', 'broken equipment']
  },

  'warranty-claim': {
    title: '🛡️ Warranty Claim Process',
    description: 'Customer needs to file a warranty claim for defective equipment',
    scenario: 'A customer discovers their equipment has a manufacturing defect and wants to file a warranty claim.',
    steps: [
      {
        step: 1,
        action: 'Verify warranty coverage',
        details: 'Check device warranty status and expiration date',
        url: '/my-devices',
        explanation: 'Warranty claims must be filed while coverage is active'
      },
      {
        step: 2,
        action: 'Document the defect',
        details: 'Take photos and videos showing the defect clearly',
        url: '/service-requests',
        explanation: 'Clear documentation supports warranty claims'
      },
      {
        step: 3,
        action: 'Request warranty service from the device',
        details: 'On the device, click "Request Support" → Warranty, describe the defect and submit',
        url: '/my-devices',
        explanation: 'Initiating from device ensures correct linkage and validation'
      },
      {
        step: 4,
        action: 'Include defect evidence',
        details: 'Upload photos, videos, and any relevant documentation',
        url: '/service-requests',
        explanation: 'Evidence helps warranty team evaluate claims quickly'
      },
      {
        step: 5,
        action: 'Track claim progress',
        details: 'Monitor request status and respond to any questions',
        url: '/service-requests',
        explanation: 'Active participation speeds up warranty processing'
      }
    ],
    tips: [
      'File warranty claims as soon as defects are discovered',
      'Keep original packaging and documentation if possible',
      'Be specific about when the defect first appeared'
    ],
    keywords: ['warranty claim', 'defect', 'manufacturing defect', 'warranty service', 'defective']
  },

  // Profile and Account Scenarios
  'company-information-update': {
    title: '🏢 Update Company Information',
    description: 'Customer needs to update company details for contracts and billing',
    scenario: 'A customer has changed their company address, contact information, or business details.',
    steps: [
      {
        step: 1,
        action: 'Access profile section',
        details: 'Navigate to your profile page to view current information',
        url: '/profile',
        explanation: 'Profile page contains all your personal and company information'
      },
      {
        step: 2,
        action: 'Review current information',
        details: 'Check all fields for accuracy and completeness',
        url: '/profile',
        explanation: 'Ensuring information is current prevents contract and billing issues'
      },
      {
        step: 3,
        action: 'Update changed information',
        details: 'Edit fields that need updating with new information',
        url: '/profile',
        explanation: 'Current information ensures smooth business operations'
      },
      {
        step: 4,
        action: 'Save changes',
        details: 'Click save to update your profile across the system',
        url: '/profile',
        explanation: 'Changes take effect immediately across all system functions'
      },
      {
        step: 5,
        action: 'Verify updates',
        details: 'Check that changes appear correctly in your profile',
        url: '/profile',
        explanation: 'Verification ensures updates were processed correctly'
      }
    ],
    tips: [
      'Update information promptly when changes occur',
      'Double-check all information before saving',
      'Keep tax and legal information current'
    ],
    keywords: ['company information', 'address update', 'contact update', 'business details', 'profile update']
  },

  'password-security': {
    title: '🔐 Password Security Update',
    description: 'Customer wants to improve account security with a new password',
    scenario: 'A customer wants to change their password for security reasons or has security concerns.',
    steps: [
      {
        step: 1,
        action: 'Access password change',
        details: 'Go to Profile → Change Password section',
        url: '/profile/change-password',
        explanation: 'Password changes are done through the profile section'
      },
      {
        step: 2,
        action: 'Enter current password',
        details: 'Provide your current password for verification',
        url: '/profile/change-password',
        explanation: 'Current password verification prevents unauthorized changes'
      },
      {
        step: 3,
        action: 'Create new password',
        details: 'Generate a strong, unique password',
        url: '/profile/change-password',
        explanation: 'Strong passwords protect your account from unauthorized access'
      },
      {
        step: 4,
        action: 'Confirm new password',
        details: 'Re-enter the new password to confirm',
        url: '/profile/change-password',
        explanation: 'Confirmation prevents typos in new passwords'
      },
      {
        step: 5,
        action: 'Update password',
        details: 'Click update to change your password',
        url: '/profile/change-password',
        explanation: 'New password takes effect immediately'
      }
    ],
    tips: [
      'Use a password manager for strong, unique passwords',
      'Never share your password with anyone',
      'Change passwords regularly for better security'
    ],
    keywords: ['password change', 'security', 'account security', 'strong password', 'password update']
  },

  // Search and Navigation Scenarios
  'find-specific-device': {
    title: '🔍 Find Specific Device Information',
    description: 'Customer needs to locate and view details for a particular device',
    scenario: 'A customer wants to find information about a specific device but doesn\'t remember where it\'s located in the system.',
    steps: [
      {
        step: 1,
        action: 'Navigate to My Devices',
        details: 'Go to the devices page to access device search',
        url: '/my-devices',
        explanation: 'Device search is available on the main devices page'
      },
      {
        step: 2,
        action: 'Use search function',
        details: 'Enter device name, model, or serial number in search bar',
        url: '/my-devices',
        explanation: 'Search helps quickly locate specific devices'
      },
      {
        step: 3,
        action: 'Apply filters if needed',
        details: 'Use status filters to narrow down results',
        url: '/my-devices',
        explanation: 'Filters help find devices with specific characteristics'
      },
      {
        step: 4,
        action: 'View device details',
        details: 'Click on the found device to see complete information',
        url: '/my-devices',
        explanation: 'Detailed view shows all device information and history'
      }
    ],
    tips: [
      'Use partial names or model numbers if exact match isn\'t found',
      'Try different search terms if initial search doesn\'t work',
      'Use filters to narrow down large device lists'
    ],
    keywords: ['find device', 'search device', 'device search', 'locate device', 'device information']
  },

  'track-service-progress': {
    title: '📊 Track Service Request Progress',
    description: 'Customer wants to check the status of their service requests',
    scenario: 'A customer has submitted service requests and wants to check their current status and progress.',
    steps: [
      {
        step: 1,
        action: 'Access service requests',
        details: 'Navigate to the Service Requests page',
        url: '/service-requests',
        explanation: 'Service requests page shows all your requests and their status'
      },
      {
        step: 2,
        action: 'Review request list',
        details: 'Browse through your submitted service requests',
        url: '/service-requests',
        explanation: 'List view shows all requests with current status'
      },
      {
        step: 3,
        action: 'Check request status',
        details: 'Look at status indicators for each request',
        url: '/service-requests',
        explanation: 'Status shows current progress of each request'
      },
      {
        step: 4,
        action: 'View detailed progress',
        details: 'Click on requests to see detailed status and staff notes',
        url: '/service-requests',
        explanation: 'Detailed view shows progress updates and next steps'
      },
      {
        step: 5,
        action: 'Monitor updates',
        details: 'Check regularly for status changes and new information',
        url: '/service-requests',
        explanation: 'Regular monitoring keeps you informed of progress'
      }
    ],
    tips: [
      'Check service requests regularly for updates',
      'Read staff notes for detailed progress information',
      'Contact support if requests seem stuck or unclear'
    ],
    keywords: ['track progress', 'service status', 'request status', 'progress tracking', 'service updates']
  }
}

// Helper function to get scenarios for a specific topic
export function getCustomerScenarios(topic: string) {
  return CUSTOMER_SCENARIOS[topic as keyof typeof CUSTOMER_SCENARIOS] || null
}

// Helper function to get all scenario topics
export function getAllScenarioTopics() {
  return Object.keys(CUSTOMER_SCENARIOS).map(key => ({
    key,
    ...CUSTOMER_SCENARIOS[key as keyof typeof CUSTOMER_SCENARIOS]
  }))
}

// Helper function to find relevant scenarios based on user query
export function findRelevantScenarios(userQuery: string): Array<{key: string, title: string, description: string, relevance: number}> {
  const query = userQuery.toLowerCase()
  const results: Array<{key: string, title: string, description: string, relevance: number}> = []
  
  for (const [key, scenario] of Object.entries(CUSTOMER_SCENARIOS)) {
    let relevance = 0
    
    // Check if query matches title or description
    if (query.includes(scenario.title.toLowerCase())) {
      relevance += 3
    }
    
    if (query.includes(scenario.description.toLowerCase())) {
      relevance += 2
    }
    
    // Check if query matches scenario content
    if (query.includes(scenario.scenario.toLowerCase())) {
      relevance += 2
    }
    
    // Check if query matches step content
    for (const step of scenario.steps) {
      if (query.includes(step.action.toLowerCase()) || query.includes(step.details.toLowerCase())) {
        relevance += 1
      }
    }
    
    // Check if query matches keywords
    for (const keyword of scenario.keywords) {
      if (query.includes(keyword.toLowerCase())) {
        relevance += 1
      }
    }
    
    if (relevance > 0) {
      results.push({
        key,
        title: scenario.title,
        description: scenario.description,
        relevance
      })
    }
  }
  
  // Sort by relevance (highest first)
  return results.sort((a, b) => b.relevance - a.relevance)
}

export default CUSTOMER_SCENARIOS
