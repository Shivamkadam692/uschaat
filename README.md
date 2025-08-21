# Chaat - Real-time Chat Application

Chaat is a real-time chat application similar to WhatsApp, built using Node.js, Express, Socket.io, EJS, and MongoDB.

## Features

- User authentication (signup/login)
- Real-time messaging using Socket.io
- Online status indicators
- Typing indicators
- Read receipts
- Message history
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)

## Installation

1. Clone the repository or download the source code

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/chaat
   SESSION_SECRET=your_secret_key_here
   ```

4. Create the `public/img` directory if it doesn't exist
   ```
   mkdir -p public/img
   ```

## Running the Application

1. Start MongoDB (if using local installation)
   ```
   mongod
   ```

2. Start the application
   ```
   npm start
   ```

3. For development with auto-restart
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
├── config/             # Configuration files
│   ├── auth.js         # Authentication middleware
│   ├── passport.js     # Passport.js configuration
│   └── socket.js       # Socket.io configuration
├── controllers/        # Route controllers
├── models/             # MongoDB models
│   ├── User.js         # User model
│   ├── Message.js      # Message model
│   └── Conversation.js # Conversation model
├── public/             # Static files
│   ├── css/            # CSS files
│   ├── js/             # JavaScript files
│   └── img/            # Images
├── routes/             # Express routes
│   ├── index.js        # Main routes
│   ├── users.js        # User routes
│   └── chat.js         # Chat routes
├── views/              # EJS templates
│   ├── partials/       # Partial templates
│   ├── chat.ejs        # Chat page
│   ├── dashboard.ejs   # Dashboard page
│   ├── login.ejs       # Login page
│   ├── register.ejs    # Registration page
│   └── welcome.ejs     # Welcome page
├── .env                # Environment variables
├── app.js              # Main application file
└── package.json        # Project dependencies
```

## Technologies Used

- **Backend**: Node.js, Express
- **Database**: MongoDB, Mongoose
- **Authentication**: Passport.js, bcryptjs
- **Real-time Communication**: Socket.io
- **Frontend**: EJS, Bootstrap 5, Font Awesome
- **Session Management**: express-session, connect-mongo

## License

This project is licensed under the MIT License.