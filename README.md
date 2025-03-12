# AI-Powered Advertising Strategy Platform

An advanced platform for advertising agencies to manage client documents, conduct research, generate strategic insights, and collaborate on campaign development.

## Core Features

- **Document Management:** Upload, organize, and search client documents.
- **AI-Powered Research:** Generate research, analyze market trends, and extract insights.
- **Strategic Insights Engine:** Automatically generate strategic insights from documents and research.
- **Collaborative Workspace:** Share and collaborate on projects with team members and clients.

## Technical Stack

- **Frontend:** React with Next.js
- **Backend:** Firebase (Authentication, Firestore, Storage, Functions)
- **AI Integration:** OpenAI API (GPT-4) and Embedding APIs
- **Vector Database:** Pinecone (for RAG implementation)
- **Deployment:** Firebase Hosting

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Firebase account
- OpenAI API key
- Pinecone account and API key

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key

NEXT_PUBLIC_PINECONE_API_KEY=your_pinecone_api_key
NEXT_PUBLIC_PINECONE_INDEX=your_pinecone_index_name
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/agency-strategy-platform.git
cd agency-strategy-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
```bash
npm install -g firebase-tools
firebase login
firebase init
```

4. Install Firebase Functions dependencies:
```bash
cd functions
npm install
cd ..
```

### Running Locally

Start the development server:
```bash
npm run dev
```

### Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
firebase deploy
```

## Project Structure

```
/
├── src/
│   ├── components/        # Reusable UI components
│   ├── context/           # React context providers
│   ├── firebase/          # Firebase service abstraction
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Next.js pages
│   ├── services/          # Service layer (AI, etc.)
│   ├── styles/            # Global styles
│   └── utils/             # Utility functions
├── functions/             # Firebase Cloud Functions
├── public/                # Static assets
├── firestore.rules        # Firestore security rules
├── storage.rules          # Storage security rules
└── firestore.indexes.json # Firestore indexes
```

## Security Rules

The platform implements comprehensive security rules to ensure:

- Organization-level isolation
- Project-based access control
- Role-specific permissions
- Document access restrictions

## License

[MIT License](LICENSE)