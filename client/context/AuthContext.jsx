import { createContext, useEffect, useState } from "react";
import axios from 'axios'
import toast from "react-hot-toast";
import io from "socket.io-client"

const backendUrl = import.meta.env.VITE_BACKEND_URL
axios.defaults.baseUrl = backendUrl                        // sets a default base URL so subsequent axios calls can use relative paths

export const AuthContext = createContext()                 // Create and export a React context object so any consumer can access authentication state and helpers.

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem("token"))
    const [authUser, setAuthUser] = useState(null)
    const [onlineUser, setOnlineUser] = useState([])
    const [socket, setSocket] = useState(null)

    // Check if user is authenticated and if so, set the user data and connect the socket
    const checkAuth = async () => {
        try {

            // takes the control to backend /check route that is first goes to middleware auth.js(protectRoute fnc) then authCheck 
            // controller then the controller sends a res to frontend i.e. here cycle complete
            const { data } = await axios.get("/api/auth/check")     // now data variable is equal to req.user both are objects 
            if (data.success) {
                setAuthUser(data.user)
                connectSocket(data.user)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // state and credentials are parameters of the login() function.
    // They are passed from the component that calls login() (like your login or register page).
    // state decides which route to call (login or register).
    // credentials carries the user form data.
    const login = async (state, credentials) => {
        try {
            const { data } = await axios.post(
                backendUrl + `/api/auth/${state}`,
                credentials
            );

            if (data.success) {
                setAuthUser(data.userData)
                setSocket(data.userData)

                axios.defaults.headers.common["token"] = data.token   // saves token as a header in the frontend 
                setToken(data.token);

                localStorage.setItem("token", data.token)
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(data.message)
        }
    }

    const logout = async () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        axios.defaults.headers.common["token"] = null;
        toast.success("Logged out successfully");
    };

    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put(
                backendUrl + "/api/auth/update-profile",
                body
            );
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated successfully");
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Connect socket function to handle socket connection and online users updates
    const connectSocket = (userData) => {
        if (!userData || socket?.connected) return;
        const newSocket = io(backendUrl, {
            query: {
                userId: userData._id
            }
        })
        newSocket.connect()
        setSocket(newSocket)

        newSocket.on("getOnlineUsers", (userId) => {
            setOnlineUser(userIds);
        })
    }

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["token"] = token;
        }
        checkAuth()
    }, [])

    const value = {
        axios,
        authUser,
        onlineUser,
        socket,
        login,
        logout,
        updateProfile
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}


