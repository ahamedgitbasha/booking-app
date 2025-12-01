import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "./UserContext";


export default function Navbar() {
  const { user, logout } = useContext(UserContext);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <Link className="navbar-brand" to="/">BookingApp</Link>

      <button 
        className="navbar-toggler" 
        type="button" 
        data-bs-toggle="collapse" 
        data-bs-target="#navMenu"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navMenu">
        <ul className="navbar-nav me-auto">
          <li className="nav-item">
            <Link className="nav-link" to="/rooms">Rooms</Link>
            <Link className="nav-link" to="/my-bookings">My Bookings</Link>
          </li>
        </ul>

        <div className="d-flex align-items-center">
          {user ? (
            <>
              <small className="text-white me-3">Hi, {user.email}</small>
              <button className="btn btn-outline-light btn-sm" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <Link className="btn btn-outline-light btn-sm" to="/auth">
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
