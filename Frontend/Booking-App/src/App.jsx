import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MyBookings from "./Components/MyBookings";


import Navbar from "./Components/Navbar";
import AuthForm from "./Components/AuthForm";
import Home from "./Components/Home";
import AllRooms from "./Components/AllRooms";
import Booking from "./Components/Booking";
import { UserContext } from "./Components/UserContext";

export default function App() {
  const ctx = useContext(UserContext);
  const user = ctx?.user ?? null;

  return (
    <>
      <Navbar />

      <div className="container mt-4">
        <Routes>
          // add this route (place near other routes)
          <Route path="/my-bookings" element={<MyBookings />} />

          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<AllRooms />} />
          <Route path="/rooms/:id/book" element={<Booking />} />
          <Route
            path="/auth"
            element={user ? <Navigate to="/" replace /> : <AuthForm />}
          />
          <Route path="*" element={<h3>Not found</h3>} />
        </Routes>
      </div>
    </>
  );
}
