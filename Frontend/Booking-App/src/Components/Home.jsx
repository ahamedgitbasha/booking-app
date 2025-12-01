import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="py-4">
      <h1 className="fw-bold">Welcome to BookingApp</h1>
      <p className="text-muted">
        Browse rooms and make bookings. Use the Rooms page to get started.
      </p>

      <Link className="btn btn-primary me-3" to="/rooms">
        Browse Rooms
      </Link>

      <Link className="btn btn-outline-secondary" to="/auth">
        Login / Register
      </Link>
    </div>
  );
}

