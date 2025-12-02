import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import { RequireAuth } from "./auth/RequireAuth.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import Orders from "./pages/Orders.jsx";
import Constructor from "./pages/Constructor.jsx";

function Layout({ children }) {
    const { token, setToken } = useAuth();

    return (
        <div style={{ fontFamily: "system-ui", padding: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/products">Products</Link>
                <Link to="/orders">Orders</Link>
                <Link to="/constructor">Settings/Constructor</Link>

                <div style={{ marginLeft: "auto" }}>
                    {token ? (
                        <button onClick={() => setToken(null)}>Logout</button>
                    ) : (
                        <>
                            <Link to="/login">Login</Link> {" | "}
                            <Link to="/register">Register</Link>
                        </>
                    )}
                </div>
            </div>

            {children}
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    <Route
                        path="/dashboard"
                        element={
                            <RequireAuth>
                                <Layout><Dashboard /></Layout>
                            </RequireAuth>
                        }
                    />

                    <Route
                        path="/products"
                        element={
                            <RequireAuth>
                                <Layout><Products /></Layout>
                            </RequireAuth>
                        }
                    />

                    <Route
                        path="/orders"
                        element={
                            <RequireAuth>
                                <Layout><Orders /></Layout>
                            </RequireAuth>
                        }
                    />

                    <Route
                        path="/constructor"
                        element={
                            <RequireAuth>
                                <Layout><Constructor /></Layout>
                            </RequireAuth>
                        }
                    />

                    <Route path="/login" element={<Layout><Login /></Layout>} />
                    <Route path="/register" element={<Layout><Register /></Layout>} />

                    <Route path="*" element={<div>Not found</div>} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
