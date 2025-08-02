# Customer Support Chat System Setup Guide

## Overview

This chat system provides real-time customer support functionality with the following features:

### For Customers (CUSTOMER role):
- Beautiful animated chat bubble in the bottom-right corner
- Real-time messaging with support team
- Image upload capability
- Link preview functionality
- Automatic connection to available support team members
- Status indicators and estimated wait times

### For Support Team (SUPPORT_TEAM role):
- Dedicated support dashboard at `/support`
- Real-time chat interface with multiple customers
- Automatic assignment of waiting customers
- Support for up to 5 concurrent chat sessions
- Online/offline status management
- Beautiful UI with animations and modern design

## Features

### Core Functionality
- ✅ Real-time messaging using Firebase Realtime Database
- ✅ Image upload and sharing
- ✅ Link preview (basic implementation)
- ✅ Automatic customer-to-support assignment
- ✅ Support team capacity management (max 5 customers per support member)
- ✅ Online/offline status tracking
- ✅ Estimated wait time calculation
- ✅ Beautiful animations and modern UI
- ✅ Role-based access control

### UI/UX Features
- ✅ Smooth animations using Framer Motion
- ✅ Responsive design
- ✅ Modern gradient designs
- ✅ Loading states and error handling
- ✅ Real-time status updates
- ✅ Unread message indicators
- ✅ File upload progress
- ✅ Typing indicators

## Setup Instructions

### 1. Firebase Configuration

Create a `.env.local` file in the frontend directory with the following variables:

```env
# Firebase Configuration for Chat System
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cem-project-62f0a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id_here
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://cem-project-62f0a-default-rtdb.asia-southeast1.firebasedatabase.app

# Chat System Configuration
NEXT_PUBLIC_MAX_SUPPORT_CUSTOMERS=5
NEXT_PUBLIC_CHAT_MESSAGE_LIMIT=1000
NEXT_PUBLIC_CHAT_FILE_SIZE_LIMIT=10485760
```

### 2. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing project
3. Enable Realtime Database
4. Set up Storage for image uploads
5. Configure security rules:

#### Realtime Database Rules:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

#### Storage Rules:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /chat_images/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### 3. User Roles

The system uses the following roles:
- `CUSTOMER`: Can access chat bubble and send messages
- `SUPPORT_TEAM`: Can access support dashboard and handle customer chats

### 4. Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Usage

### For Customers:
1. Log in with a CUSTOMER role account
2. The chat bubble will appear in the bottom-right corner
3. Click the chat bubble to start a conversation
4. Type messages and send images
5. Links will automatically show previews

### For Support Team:
1. Log in with a SUPPORT_TEAM role account
2. Navigate to `/support` or click "Customer Support" in the sidebar
3. Go online to receive chat requests
4. Accept waiting chat sessions
5. Respond to customer messages
6. Close chat sessions when complete

## File Structure

```
Frontend/CEM-Frontend/
├── components/
│   └── chat/
│       └── customer-chat-bubble.tsx    # Customer chat interface
├── app/
│   └── support/
│       └── page.tsx                    # Support team dashboard
├── lib/
│   ├── firebase.ts                     # Firebase configuration
│   ├── chat-service.ts                 # Chat functionality
│   ├── support-assignment.ts           # Auto-assignment logic
│   └── link-preview.ts                 # Link preview service
├── types/
│   └── chat.ts                         # TypeScript interfaces
└── .env.local                          # Environment variables
```

## Key Components

### CustomerChatBubble
- Beautiful animated chat bubble
- Real-time messaging
- Image upload
- Link preview
- Status indicators

### SupportPage
- Support team dashboard
- Session management
- Real-time chat interface
- Online/offline status
- Capacity management

### ChatService
- Firebase Realtime Database integration
- Message handling
- Session management
- File upload

### SupportAssignmentService
- Automatic customer assignment
- Load balancing
- Wait time estimation
- Availability tracking

## Security Considerations

1. **Environment Variables**: Keep Firebase config in `.env.local` (already in .gitignore)
2. **Role-based Access**: Only CUSTOMER and SUPPORT_TEAM roles can access chat features
3. **File Upload Limits**: 10MB maximum for images
4. **Rate Limiting**: Consider implementing rate limiting for production

## Production Deployment

1. Set up Firebase project for production
2. Configure proper security rules
3. Set environment variables in deployment platform
4. Enable Firebase Authentication if needed
5. Set up monitoring and logging

## Troubleshooting

### Common Issues:

1. **Chat bubble not appearing**: Check if user has CUSTOMER role
2. **Support page access denied**: Check if user has SUPPORT_TEAM role
3. **Firebase connection errors**: Verify environment variables
4. **Image upload fails**: Check Firebase Storage configuration
5. **Real-time updates not working**: Verify Firebase Realtime Database rules

### Debug Mode:
Enable console logging by setting `NODE_ENV=development` to see detailed logs.

## Future Enhancements

- [ ] Advanced link preview with metadata
- [ ] File sharing (documents, PDFs)
- [ ] Chat history and search
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Chat transcripts
- [ ] Integration with ticketing system
- [ ] AI-powered responses
- [ ] Multi-language support
- [ ] Mobile app support

## Support

For technical support or questions about the chat system, please refer to the development team or create an issue in the project repository. 