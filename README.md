🏨 Booking App — Full Stack Hotel/Room Booking System

A complete full-stack booking application built with React (Vite) for frontend and Django + Django REST Framework for backend.
This app allows users to browse rooms, check availability, and make bookings.

📌 Features
🌐 Frontend (React + Vite)

Modern & fast UI built with React

Room listing page

Room details page

Date selection

Booking form

JWT/Token-based authentication (if used)

Responsive design

🛠 Backend (Django + DRF)

REST API for rooms, bookings, images, and availability

Admin panel for room management

Room types, images, and occupied dates stored in DB

Serializer, Views & Models structured cleanly

API endpoints for:

Rooms

Room images

Booking creation

Occupied dates

🧰 Tech Stack
Frontend

React

Vite

Axios

React Hooks

CSS

Backend

Django

Django REST Framework

SQLite / PostgreSQL

Python

📁 Project Structure
Booking_App/
│
├── Backend/                 # Django backend (API)
│   ├── manage.py
│   ├── rooms/               # App for rooms, bookings
│   ├── authentication/      # If used
│   ├── media/               # Uploaded images
│   └── db.sqlite3
│
├── Frontend/                # React frontend (UI)
│   ├── src/
│   │   ├── Components/
│   │   ├── assets/
│   │   ├── index.css
│   │   └── main.jsx
│   └── vite.config.js
│
└── README.md

▶️ How to Run Backend (Django)
cd Backend
python -m venv venv
venv\Scripts\activate   # Windows
# OR source venv/bin/activate (Mac/Linux)

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver


Backend will run at:
👉 http://127.0.0.1:8000

▶️ How to Run Frontend (React + Vite)
cd Frontend
npm install
npm run dev


Frontend will run at:
👉 http://localhost:5173

🔗 API Endpoints (Important for Interviews)
Method	Endpoint	Description
GET	/api/rooms/	List all rooms
GET	/api/rooms/<id>/	Room details
GET	/api/rooms/<id>/images/	Room images
GET	/api/rooms/<id>/occupied-dates/	Booking dates
POST	/api/book-room/	Create a booking

(Add or adjust based on your actual backend)

📸 Screenshots (Add Later)

You can add screenshots like this:

![Home Screen](screenshots/home.png)
![Room Details](screenshots/room-details.png)


If you want, I’ll help you capture and add screenshots.

🚀 Future Enhancements (Good for Resume)

Payment integration

User login + register

Search + filters

Room recommendations

Multi-language support

Admin dashboard (React)

👤 Author

Ahamed Basha
GitHub: https://github.com/ahamedgitbasha

