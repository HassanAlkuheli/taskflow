# Todo App

A full-stack todo application built with React and Node.js.

## Features

- User authentication
- Category management
- Task organization
- Dark/Light mode
- Drag and drop interface

## Tech Stack

- Frontend:
  - React
  - Axios
  - Tailwind CSS
  - DND Kit
  - Framer Motion

- Backend:
  - Node.js
  - Express
  - MongoDB
  - JWT Authentication

## Setup

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/REPO_NAME.git
cd todo
```

2. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Environment setup:
   - Create `.env` file in server directory
   - Add required environment variables:
```env
PORT=8080
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

4. Run the application:
```bash
# Run server (from server directory)
npm run dev

# Run client (from client directory)
npm run dev
```

## License

MIT
