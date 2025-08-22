# 🧠 CEM AI Context System

## Overview

The CEM AI Context System is a comprehensive knowledge base that empowers Gemini AI to provide expert assistance to customers using the CEM (Customer Equipment Management) system. This system provides detailed, step-by-step guidance for all customer functionalities, real-world scenarios, and comprehensive support resources.

## 🏗️ System Architecture

### Core Components

1. **`context.ts`** - Main context builder that generates comprehensive system knowledge
2. **`customer-faq.ts`** - Frequently asked questions with detailed answers
3. **`customer-onboarding.ts`** - Step-by-step onboarding guide for new customers
4. **`customer-scenarios.ts`** - Real-world customer situations and solutions
5. **`client.ts`** - AI client integration for chat functionality

### Knowledge Base Structure

```
📚 CEM AI Knowledge Base
├── 🎯 Customer Role Capabilities
├── 🗺️ System Navigation Map
├── 🔧 System Services & Features
├── 🚀 Customer Onboarding Guide
├── 🎭 Real-World Customer Scenarios
├── 📚 Customer Support Guidelines
├── ❓ Frequently Asked Questions
└── 💡 Proactive Support Strategies
```

## 🚀 Features

### 1. Comprehensive Customer Functionality Guide
- **13 major functional areas** covering all customer capabilities
- **Step-by-step instructions** for every customer action
- **Direct navigation links** (both development and production URLs)
- **Detailed explanations** of what customers can see and do

### 2. Intelligent FAQ System
- **Keyword-based search** for finding relevant answers
- **Categorized questions** by functionality area
- **Detailed step-by-step solutions** for common problems
- **Proactive tips** and best practices

### 3. Customer Onboarding Guide
- **9 comprehensive onboarding topics** for new customers
- **Detailed step-by-step processes** for getting started
- **Practical tips** and best practices
- **Progressive learning path** from basics to advanced features

### 4. Real-World Customer Scenarios
- **12 common customer situations** with detailed solutions
- **Step-by-step action plans** for each scenario
- **Direct URL references** for navigation
- **Pro tips** and best practices for each situation

### 5. Dynamic Context Generation
- **Automatic route discovery** from the application structure
- **Service function analysis** for comprehensive feature coverage
- **Environment-aware URL generation** (dev/prod)
- **Real-time context updates** based on system changes

## 🔧 Technical Implementation

### Context Building Process

```typescript
export async function buildSiteContext(options: BuildContextOptions = {}): Promise<string>
```

1. **Route Discovery**: Automatically scans the app directory for all available routes
2. **Service Analysis**: Analyzes service files to understand available functionality
3. **URL Generation**: Creates both development and production URLs for navigation
4. **Knowledge Compilation**: Combines all knowledge sources into comprehensive context

### Knowledge Sources Integration

```typescript
// FAQ Integration
import { CUSTOMER_FAQ, findRelevantFAQ } from './customer-faq'

// Onboarding Integration  
import { CUSTOMER_ONBOARDING, findRelevantOnboarding } from './customer-onboarding'

// Scenarios Integration
import { CUSTOMER_SCENARIOS, findRelevantScenarios } from './customer-scenarios'
```

### Search and Matching Functions

- **`findRelevantFAQ(query)`** - Find FAQ entries based on user queries
- **`findRelevantOnboarding(query)`** - Find onboarding topics based on user needs
- **`findRelevantScenarios(query)`** - Find relevant scenarios for user situations

## 📋 Customer Functionality Coverage

### 1. Authentication & Login
- Login process and troubleshooting
- Password management and security
- Account access and permissions

### 2. Dashboard & Overview
- Personal account summary
- Quick access to main functions
- System notifications and alerts

### 3. Profile Management
- Personal information updates
- Company details management
- Contact information maintenance

### 4. Device Management
- View all owned devices
- Device status monitoring
- Warranty information tracking
- Maintenance history review

### 5. Contract Management
- View signed contracts
- Contract status monitoring
- Payment information access
- Terms and conditions review

### 6. Service Request Management
- Create maintenance requests
- Submit warranty claims
- Track request progress
- Upload supporting documents

### 7. AI Chat Support
- 24/7 assistance availability
- Context-aware responses
- Direct navigation guidance
- Step-by-step instructions

### 8. Search & Navigation
- Advanced search capabilities
- Filter and sort options
- Efficient information finding
- Mobile-responsive design

## 🎯 AI Assistant Capabilities

### Response Guidelines
1. **Always provide step-by-step instructions**
2. **Include direct links to relevant pages**
3. **Explain what customers can and cannot do**
4. **Provide context for why features exist**
5. **Use exact URLs from the knowledge base**
6. **Reference relevant scenarios and FAQs**
7. **Offer proactive suggestions and alternatives**

### Conversation Style
- **Helpful**: Always try to solve customer problems
- **Educational**: Explain concepts and processes clearly
- **Efficient**: Provide direct answers with minimal fluff
- **Friendly**: Use warm, professional tone
- **Thorough**: Cover all aspects of what customers need to know

### Proactive Support
- **Anticipate needs** based on context
- **Suggest relevant features** proactively
- **Offer alternatives** when primary approach doesn't work
- **Follow up** to ensure understanding
- **Educate** customers about system benefits

## 🔍 Knowledge Search & Matching

### FAQ Search Algorithm
```typescript
export function findRelevantFAQ(userQuery: string): Array<{
  question: string
  answer: string
  relevance: number
}>
```

- **Keyword matching** with relevance scoring
- **Question and answer content** analysis
- **Sorted results** by relevance score
- **Context-aware** response generation

### Scenario Matching
```typescript
export function findRelevantScenarios(userQuery: string): Array<{
  key: string
  title: string
  description: string
  relevance: number
}>
```

- **Multi-factor relevance scoring**
- **Title and description matching**
- **Step content analysis**
- **Keyword-based identification**

## 📱 Mobile & Responsiveness

### Mobile-Optimized Features
- **Responsive design** for all screen sizes
- **Touch-friendly interface** elements
- **Mobile-optimized navigation**
- **Easy-to-use mobile forms**
- **Optimized for mobile browsers**

### Best Practices
- **Landscape orientation** for better viewing
- **Tap and hold** for additional options
- **Mobile menu navigation**
- **Zoom functionality** for detailed information

## 🔒 Security & Privacy

### Customer Data Protection
- **Role-based access control**
- **Data encryption** in transit and storage
- **Session management** and automatic logout
- **Audit logging** of all activities
- **Privacy rights** and data control

### Security Features
- **Secure login** with encrypted passwords
- **Automatic session timeout**
- **Secure communication** protocols
- **Access control** and permissions
- **Suspicious activity** monitoring

## 🚀 Getting Started

### For Developers

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```env
   GEMINI_API_KEY=your_api_key_here
   NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080/api
   ```

3. **Build Context**
   ```typescript
   import { buildSiteContext } from '@/lib/ai/context'
   
   const context = await buildSiteContext({ origin: 'http://localhost:3000' })
   ```

### For AI Integration

1. **Import Knowledge Functions**
   ```typescript
   import { 
     findRelevantFAQ, 
     findRelevantOnboarding, 
     findRelevantScenarios 
   } from '@/lib/ai/context'
   ```

2. **Use Search Functions**
   ```typescript
   const faqResults = findRelevantFAQ('how to change password')
   const onboardingTopics = findRelevantOnboarding('first time setup')
   const scenarios = findRelevantScenarios('device not working')
   ```

## 📊 Performance & Optimization

### Context Generation
- **Lazy loading** of knowledge components
- **Efficient file system** scanning
- **Cached results** for repeated queries
- **Optimized search** algorithms

### Memory Management
- **Streaming context** generation for large knowledge bases
- **Efficient data structures** for fast lookups
- **Minimal memory footprint** for AI integration
- **Garbage collection** friendly implementation

## 🔄 Maintenance & Updates

### Knowledge Base Updates
1. **FAQ Updates**: Modify `customer-faq.ts` for new questions
2. **Onboarding Updates**: Update `customer-onboarding.ts` for new processes
3. **Scenario Updates**: Add new scenarios to `customer-scenarios.ts`
4. **Context Updates**: Modify `context.ts` for structural changes

### System Integration
- **Automatic route discovery** updates with new pages
- **Service analysis** updates with new functionality
- **Dynamic URL generation** for new environments
- **Real-time context** updates during development

## 🧪 Testing & Validation

### Test Coverage
- **Unit tests** for all search functions
- **Integration tests** for context generation
- **Performance tests** for large knowledge bases
- **Accuracy tests** for AI responses

### Validation Process
1. **Knowledge accuracy** verification
2. **URL validation** and accessibility
3. **Search relevance** testing
4. **AI response quality** assessment

## 📈 Future Enhancements

### Planned Features
- **Machine learning** for better query matching
- **Natural language processing** improvements
- **Multi-language support** for international customers
- **Advanced analytics** for usage patterns
- **Integration** with external knowledge bases

### Scalability Improvements
- **Distributed knowledge** storage
- **Real-time updates** and synchronization
- **Advanced caching** strategies
- **Performance optimization** for large deployments

## 🤝 Contributing

### Development Guidelines
1. **Follow TypeScript** best practices
2. **Maintain consistent** code structure
3. **Add comprehensive** documentation
4. **Include unit tests** for new features
5. **Update README** for significant changes

### Knowledge Base Contributions
1. **Add new FAQ entries** for common questions
2. **Create onboarding guides** for new features
3. **Document real-world scenarios** for customer situations
4. **Update existing content** for accuracy and relevance

## 📞 Support & Contact

### Technical Support
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Comprehensive guides and examples
- **Community**: Developer forums and discussions

### Knowledge Base Support
- **Content Updates**: Submit corrections and improvements
- **New Scenarios**: Suggest additional customer situations
- **FAQ Contributions**: Add new questions and answers

---

## 📝 License

This project is part of the CEM (Customer Equipment Management) system and is proprietary to CÔNG TY TNHH KINH DOANH XUẤT NHẬP KHẨU TM VÀ SX THÀNH ĐẠT.

---

*Last updated: December 2024*
*Version: 2.0.0*
*Maintainer: CEM Development Team*

