import { useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("m1@test.com");
    const [password, setPassword] = useState("password123");
    const [err, setErr] = useState(null);

    const { setToken } = useAuth();
    const nav = useNavigate();

    async function onSubmit(e) {
        e.preventDefault();
        setErr(null);
        try {
            const data = await api("/auth/login", { method: "POST", body: { email, password } });
            setToken(data.token);
            nav("/dashboard");
        } catch (e2) {
            setErr(e2.message);
        }
    }

    return (
        <div style={{ maxWidth: 420 }}>
            <h2>Login</h2>
            <form onSubmit={onSubmit}>
                <div style={{ marginBottom: 8 }}>
                    <div>Email</div>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} />
                </div>
                <div style={{ marginBottom: 8 }}>
                    <div>Password</div>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%" }} />
                </div>
                <button type="submit">Login</button>
            </form>
            {err && <div style={{ marginTop: 10, color: "crimson" }}>{err}</div>}
        </div>
    );
}
