# 🚀 CareerPilot AI

CareerPilot AI is an AI-powered placement preparation platform that helps students improve their resumes, evaluate ATS scores, and prepare for interviews using Large Language Models.

## 🌟 Features

- 🔐 JWT Authentication (Register & Login)
- 📄 AI Resume Analysis
- 📊 ATS Score Evaluation
- 🎯 Skill Gap Analysis
- 💡 AI Suggestions for Resume Improvement
- 📂 Resume History Management
- 🐳 Dockerized PostgreSQL Database
- ⚡ FastAPI Backend
- 🎨 React + TypeScript Frontend
- 🤖 OpenRouter AI Integration

---

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router

### Backend
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- JWT Authentication
- Pydantic

### AI
- OpenRouter API
- Gemma 4 26B

### Database
- PostgreSQL (Docker)

### DevOps
- Docker
- Git
- GitHub

---

## 📁 Project Structure

```
AI-co
│
├── backend
│   ├── routers
│   ├── services
│   ├── models
│   ├── middleware
│   ├── schemas
│   ├── core
│   └── main.py
│
├── frontend
│   ├── src
│   ├── public
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Getting Started

### 1️⃣ Clone Repository

```bash
git clone https://github.com/MPPavanKumar/AI-co.git

cd AI-co
```

---

## 🐳 Start PostgreSQL using Docker

```bash
docker compose up -d
```

Verify containers:

```bash
docker ps
```

---

## ⚙️ Backend Setup

```bash
cd backend

python -m venv .venv
```

### Windows

```bash
.venv\Scripts\activate
```

### Install dependencies

```bash
pip install -r requirements.txt
```

Create `.env`

```env
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/<database_name>

SECRET_KEY=your-secret-key

ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=30

OPENROUTER_API_KEY=your-openrouter-api-key

OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

OPENROUTER_MODEL=google/gemma-4-26b-a4b-it:free
```

Run backend

```bash
uvicorn main:app --reload
```

Backend URL

```
http://localhost:8000
```

Swagger Docs

```
http://localhost:8000/docs
```

---

## 🎨 Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend

```
http://localhost:5173
```

---

## 📚 API Features

### Authentication

- Register
- Login
- User Profile

### Resume

- Upload Resume
- AI Resume Analysis
- ATS Score
- Resume History
- Resume Suggestions

---

## 🗄️ Database Tables

- users
- resume_analyses

---

## 📸 Screenshots

### Login Page

(Add Screenshot)

### Dashboard

(Add Screenshot)

### Resume Upload

(Add Screenshot)

### Resume Analysis

(Add Screenshot)

### Swagger API

(Add Screenshot)

---

## 🔒 Environment Variables

The project requires the following environment variables.

```env
DATABASE_URL=

SECRET_KEY=

OPENROUTER_API_KEY=
```

Never commit your actual `.env` file.

---

## 🤝 Contributing

1. Fork the repository

2. Create a feature branch

```bash
git checkout -b feature-name
```

3. Commit changes

```bash
git commit -m "Added new feature"
```

4. Push

```bash
git push origin feature-name
```

5. Open a Pull Request

---

## 👨‍💻 Author

**M P Pavan Kumar**

GitHub

https://github.com/MPPavanKumar

LinkedIn

https://www.linkedin.com/in/mppavankumar

---

## ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!

---

## 📄 License

This project is licensed under the MIT License.
