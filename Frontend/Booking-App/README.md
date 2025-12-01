# Booking App (React + Django REST)

Small demo booking application built with React (Vite) frontend and Django REST backend.

## Features
- Browse rooms (images, price, description)
- Login / register (Django REST auth)
- Book rooms via a modal (date selection)
- Backend stores occupied dates per day (OccupiedDate records)
- Frontend groups occupied days into booking ranges for display
- Cancel bookings (deletes underlying occupied-date records)
- Bootstrap styling and responsive UI

## Tech stack
- **Frontend:** React (Vite), React Router, Bootstrap
- **Backend:** Django, Django REST Framework
- **Dev tools:** npm, python, virtualenv

## Project structure (frontend)

```
src/
  Components/
    AllRooms.jsx
    AuthForm.jsx
    Booking.jsx
    BookingForm.jsx
    Home.jsx
    MyBookings.jsx
    Navbar.jsx
    RoomCard.jsx
    UserContext.jsx
  App.jsx
  main.jsx
```

## Run frontend (development)
```
npm install
npm run dev
```

## Run backend (development)
```
python manage.py runserver
```

---

Project created by Ahamed Basha.
