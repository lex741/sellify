import { useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const [email, setEmail] = useState("m2@test.com");
    const [password, setPassword] = useState("password123");
    const [storeSlug, setStoreSlug] = useState("m2-shop");
    const [storeName, setStoreName] = useState("M2 Shop");
    const [err, setErr] = useState(null);

    const { setToken } = useAuth();
    const nav = useNavigate();

    async function onSubmit(e) {
        e.preventDefault();
        setErr(null);
        try {
            const data = await api("/auth/register-merchant", {
                method: "POST",
                body: { email, password, storeSlug, storeName },
            });
            setToken(data.token);
            nav("/dashboard");
        } catch (e2) {
            setErr(e2.message);
        }
    }

    return (
        <div style={{ maxWidth: 480 }}>
            <h2>Register Merchant</h2>
            <form onSubmit={onSubmit}>
                <div style={{ marginBottom: 8 }}>
                    <div>Email</div>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} />
                </div>
                <div style={{ marginBottom: 8 }}>
                    <div>Password</div>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%" }} />
                </div>
                <div style={{ marginBottom: 8 }}>
                    <div>Store slug</div>
                    <input value={storeSlug} onChange={(e) => setStoreSlug(e.target.value)} style={{ width: "100%" }} />
                </div>
                <div style={{ marginBottom: 8 }}>
                    <div>Store name</div>
                    <input value={storeName} onChange={(e) => setStoreName(e.target.value)} style={{ width: "100%" }} />
                </div>
                <button type="submit">Register</button>
            </form>
            {err && <div style={{ marginTop: 10, color: "crimson" }}>{err}</div>}
        </div>
    );
}
