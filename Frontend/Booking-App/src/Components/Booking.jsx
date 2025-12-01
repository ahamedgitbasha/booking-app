import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext";
import BookingForm from "./BookingForm";

export default function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { API, authedFetch, user } = useContext(UserContext);

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    let cancelled = false;
    async function loadRoom() {
      setLoading(true);
      setErr(null);

      try {
        const base = API || import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${base}/rooms/${id}/`);
        if (!res.ok) throw new Error("Failed to load room");

        const data = await res.json();
        if (!cancelled) setRoom(data);

      } catch (e) {
        if (!cancelled) {
          setErr(e.message || "Error loading room");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRoom();
    return () => { cancelled = true; };
  }, [id, API, user, navigate]);

  function handleBooked(data) {
    alert("Booking successful!");
    setShowModal(false);
    navigate("/my-bookings");
  }

  if (loading) return <div className="py-4">Loading room...</div>;
  if (err) return <div className="alert alert-danger mt-3">{err}</div>;
  if (!room) return <div className="py-4">Room not found.</div>;

  const img =
    room.images && room.images.length
      ? room.images[0].image || room.images[0].image_url
      : null;

  return (
    <div className="card shadow p-4">
      {/* Room Image */}
      {img && (
        <img src={img} alt="" className="img-fluid rounded mb-3" />
      )}

      <h2 className="fw-bold">{room.title || room.name}</h2>
      <p className="text-muted">{room.description}</p>

      <p className="fw-bold fs-4">
        ₹{room.price ?? room.pricePerNight ?? room.price_per_night}
      </p>

      {/* Book button */}
      <button className="btn btn-primary mt-3" onClick={() => setShowModal(true)}>
        Book This Room
      </button>

      {/* Modal Booking Form */}
      <BookingForm
        room={room}
        show={showModal}
        onClose={() => setShowModal(false)}
        onBooked={handleBooked}
        authedFetch={authedFetch}
        API={API}
      />
    </div>
  );
}

