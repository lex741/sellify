import { createContext, useContext, useMemo, useState } from "react";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [token, setTokenState] = useState(localStorage.getItem("token"));

    const setToken = (t) => {
        if (t) localStorage.setItem("token", t);
        else localStorage.removeItem("token");
        setTokenState(t);
    };

    const value = useMemo(() => ({ token, setToken }), [token]);
    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
    const v = useContext(AuthCtx);
    if (!v) throw new Error("useAuth must be used внутри AuthProvider");
    return v;
}
