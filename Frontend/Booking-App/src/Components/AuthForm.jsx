import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext";

export default function AuthForm() {
  const { login, register } = useContext(UserContext);
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    try {
      if (isRegister) {
        await register({ username, email, password });
      } else {
        await login({ username, password });
      }
      navigate("/");
    } catch (error) {
      setErr(error.message);
    }
  }

  return (
    <div className="card p-4 mx-auto shadow" style={{ maxWidth: 420 }}>
      <h3 className="mb-3">{isRegister ? "Register" : "Login"}</h3>

      {err && <div className="alert alert-danger">{err}</div>}

      <form onSubmit={handleSubmit}>
        <label className="form-label">Username</label>
        <input
          className="form-control mb-3"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {isRegister && (
          <>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control mb-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </>
        )}

        <label className="form-label">Password</label>
        <input
          type="password"
          className="form-control mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn btn-dark w-100">
          {isRegister ? "Register" : "Login"}
        </button>
      </form>

      <button
        className="btn btn-link mt-2"
        onClick={() => setIsRegister(!isRegister)}
      >
        {isRegister ? "Already have account? Login" : "New user? Register"}
      </button>
    </div>
  );
}

