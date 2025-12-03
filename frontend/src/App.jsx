import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import { RequireAuth } from "./auth/RequireAuth.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import Orders from "./pages/Orders.jsx";
import Constructor from "./pages/Constructor.jsx";

import StorefrontLayout from "./storefront/StorefrontLayout.jsx";
import StoreHome from "./storefront/StoreHome.jsx";
import ProductPage from "./storefront/ProductPage.jsx";
import CartPage from "./storefront/CartPage.jsx";
import CheckoutPage from "./storefront/CheckoutPage.jsx";

import { t } from "./i18n/t.js";

function Layout({ children }) {
    const { token, setToken } = useAuth();

    return (
        <div style={{ fontFamily: "system-ui", padding: 16, maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                {token ? (
                    <>
                        <Link to="/dashboard">{t("nav.dashboard")}</Link>
                        <Link to="/products">{t("nav.products")}</Link>
                        <Link to="/orders">{t("nav.orders")}</Link>
                        <Link to="/constructor">{t("nav.constructor")}</Link>

                        <div style={{ marginLeft: "auto" }}>
                            <button onClick={() => setToken(null)}>{t("nav.logout")}</button>
                        </div>
                    </>
                ) : (
                    <>
                        <Link to="/login">{t("nav.login")}</Link>
                        <Link to="/register">{t("nav.register")}</Link>
                    </>
                )}
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
                    {/* Merchant panel */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    <Route
                        path="/dashboard"
                        element={
                            <RequireAuth>
                                <Layout>
                                    <Dashboard />
                                </Layout>
                            </RequireAuth>
                        }
                    />

                    <Route
                        path="/products"
                        element={
                            <RequireAuth>
                                <Layout>
                                    <Products />
                                </Layout>
                            </RequireAuth>
                        }
                    />

                    <Route
                        path="/orders"
                        element={
                            <RequireAuth>
                                <Layout>
                                    <Orders />
                                </Layout>
                            </RequireAuth>
                        }
                    />

                    <Route
                        path="/constructor"
                        element={
                            <RequireAuth>
                                <Layout>
                                    <Constructor />
                                </Layout>
                            </RequireAuth>
                        }
                    />

                    <Route
                        path="/login"
                        element={
                            <Layout>
                                <Login />
                            </Layout>
                        }
                    />

                    <Route
                        path="/register"
                        element={
                            <Layout>
                                <Register />
                            </Layout>
                        }
                    />

                    {/* Storefront (публічна вітрина) */}
                    <Route path="/store/:slug" element={<StorefrontLayout />}>
                        <Route index element={<StoreHome />} />
                        <Route path="product/:productId" element={<ProductPage />} />
                        <Route path="cart" element={<CartPage />} />
                        <Route path="checkout" element={<CheckoutPage />} />
                    </Route>

                    {/* 404 */}
                    <Route
                        path="*"
                        element={
                            <Layout>
                                <div>{t("common.notFound")}</div>
                            </Layout>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
