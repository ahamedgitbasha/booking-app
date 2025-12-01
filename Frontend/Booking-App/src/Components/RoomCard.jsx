import React from "react";
import { Link } from "react-router-dom";

export default function RoomCard({ room }) {
  const img = room.images?.length ? room.images[0].image_url : null;

  return (
    <div className="card shadow-sm">
      {img ? (
        <img src={img} alt="" className="card-img-top" />
      ) : (
        <div className="card-img-top bg-light p-4 text-center">No Image</div>
      )}

      <div className="card-body">
        <h5 className="card-title">{room.title}</h5>
        <p className="card-text text-muted">
          {room.description?.slice(0, 80)}...
        </p>

        <p className="fw-bold">₹{room.price}</p>

        <Link className="btn btn-primary w-100" to={`/rooms/${room.id}/book`}>
          Book Now
        </Link>
      </div>
    </div>
  );
}
