# 🎓 StudyPilot AI

**An AI-powered smart study planner that helps students organize their studies, prepare for exams, track progress, and learn more effectively.**

## 🌐 Live Demo

- **Frontend:** https://study-pilot-ai-cyan.vercel.app/
- **Backend:** https://studypilot-ai-wwus.onrender.com

---

## 📌 About the Project

StudyPilot AI is a full-stack web application designed to make studying smarter and more productive.

It helps students manage subjects, organize topics, create study timetables, prepare for exams, and monitor their academic progress.

The application also integrates Artificial Intelligence to provide personalized learning assistance, quiz generation, and smart study recommendations.

## ✨ Features

### 🔐 Authentication
- Student registration and login
- Email OTP verification
- Secure password management
- JWT-based authentication

### 📊 Dashboard
- Overview of study activities
- Upcoming exams
- Study progress
- Important statistics

### 📚 Subject & Topic Management
- Add, edit, and delete subjects
- Organize topics under subjects
- Track topic completion
- Monitor learning progress

### 📅 Smart Timetable
- Create personalized study schedules
- Organize study sessions
- Mark sessions as completed
- Track pending study activities

### 📝 Exam Management
- Add upcoming examinations
- Edit and delete exam details
- Monitor examination dates

### 🤖 AI Learning Workspace
- AI-powered learning assistance
- Generate quizzes using AI
- Get help understanding study topics

### 📈 Progress & Analytics
- Track completed topics
- Monitor study performance
- View learning statistics

### 💡 Smart Study Recommendations
- Personalized study suggestions
- Recommendations based on learning progress

### 🔔 Notifications & Reminders
- Upcoming examination reminders
- Pending study session notifications
- Overdue study session notifications
- Email reminders

### 👤 Profile & Preferences
- Manage student profile
- Change password
- Customize study preferences

### 💬 AI Chat Assistant
- Ask study-related questions
- Get AI-powered explanations
- Receive learning assistance

---

## 🛠️ Technologies Used

### Frontend
- React.js
- Vite
- JavaScript
- HTML5
- CSS3
- React Router
- Axios
- Lucide React

### Backend
- Node.js
- Express.js
- MongoDB
- JSON Web Token (JWT)
- bcrypt
- Nodemailer / Brevo Email API
- Node-Cron

### Artificial Intelligence
- Google Gemini API

### Deployment
- Vercel – Frontend Hosting
- Render – Backend Hosting
- MongoDB Atlas – Cloud Database
- Brevo – Transactional Email Service

---

## 📂 Project Structure

```text
StudyPilot-AI/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vercel.json
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## ⚙️ Installation & Setup

Follow these steps to run StudyPilot AI locally.

### 1. Clone the Repository

```bash
git clone https://github.com/VemulaShivaSrujan/StudyPilot-AI.git
```

```bash
cd StudyPilot-AI
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder.

Add the following environment variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OTP_SECRET=your_otp_secret
GEMINI_API_KEY=your_gemini_api_key
EMAIL_USER=your_verified_sender_email
BREVO_API_KEY=your_brevo_api_key
```

Start the backend:

```bash
npm run dev
```

The backend will run at:

```text
http://localhost:5000
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend` folder.

Add:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| MONGODB_URI | MongoDB Atlas connection string |
| JWT_SECRET | Secret used for JWT authentication |
| OTP_SECRET | Secret used for OTP functionality |
| GEMINI_API_KEY | Google Gemini API key |
| EMAIL_USER | Verified sender email address |
| BREVO_API_KEY | Brevo transactional email API key |
| PORT | Backend server port |
| VITE_API_URL | Frontend API base URL |

**Important:** Never upload `.env` files, API keys, passwords, or other sensitive credentials to GitHub.

---

## 🚀 Deployment

StudyPilot AI is deployed using:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

### Live Application

https://study-pilot-ai-cyan.vercel.app/

---

## 🎯 Project Objectives

- Make study planning easier and more organized.
- Help students prepare effectively for examinations.
- Provide AI-powered learning assistance.
- Improve time management and productivity.
- Track academic progress.
- Provide personalized study recommendations.

---

## 🔮 Future Enhancements

- Advanced AI-powered study plans
- More detailed performance analytics
- Collaborative study groups
- Enhanced learning recommendations
- Additional AI learning tools

---

## 👨‍💻 Developer

**Developed by:** Vemula Shiva Srujan

**Project Name:** StudyPilot AI

**Project Type:** Full-Stack MERN Application with AI Integration

---

## 📄 License

This project is developed for educational and academic purposes.
