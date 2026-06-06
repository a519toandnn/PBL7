import { useState } from 'react';
import { useHistory } from "react-router-dom";
import swal from 'sweetalert';
import { clearStoredAuth, hasValidStoredToken } from '../utils/authToken';

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const history = useHistory();
    const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    // Sign up - call backend POST /user
    const signUpUser = async (email, password, full_name, phone = '') => {
        setIsLoading(true);
        try {
            const response = await fetch(`${apiBase}/user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    full_name,
                    phone,
                })
            });

            const json = await response.json();
            
            if (!response.ok) {
                swal("Error!", json.message || "Sign up failed!", "error");
                setIsLoading(false);
                return;
            }

            // Auto sign-in after successful sign-up
            await signInUser(email, password);
        } catch (err) {
            swal("Error!", "Network error during sign up", "error");
            setIsLoading(false);
        }
    };

    // Sign in - call backend POST /auth/login
    const signInUser = async (email, password) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const json = await response.json();
            
            if (!response.ok) {
                swal("Error!", json.message || "Email or password is incorrect!", "error");
                setIsLoading(false);
                return;
            }

            const payload = json.data || json;
            const userData = {
                id: payload.user.id,
                email: payload.user.email,
                displayName: payload.user.full_name,
                photoURL: payload.user.photo || 'https://i.pravatar.cc/150?img=1',
                phone: payload.user.phone,
                role: payload.user.role,
            };

            // Store token
            localStorage.setItem('token', payload.access_token);
            localStorage.setItem('user', JSON.stringify(userData));
            
            setUser(userData);
            swal("Success!", "Welcome back!", "success");

            // Redirect based on role
            if (userData.role === 'ADMIN') {
                history.push('/admin');
            } else {
                history.push('/');
            }
            window.scrollTo(0, 100);
        } catch (err) {
            swal("Error!", "Network error during sign in", "error");
        }
        setIsLoading(false);
    };

    // Google sign-in (no Firebase): Google Identity Services -> exchange ID token with backend
    const signInWithGoogle = async () => {
        setIsLoading(true);
        try {
            if (!googleClientId) {
                swal(
                    "Thiếu cấu hình Google Client ID",
                    "Thêm REACT_APP_GOOGLE_CLIENT_ID vào Pharmacy/.env rồi restart frontend.",
                    "error"
                );
                setIsLoading(false);
                return;
            }

            const googleApi = window.google?.accounts?.id;
            if (!googleApi) {
                swal("Google SDK chưa sẵn sàng", "Vui lòng refresh trang và thử lại.", "error");
                setIsLoading(false);
                return;
            }

            const idToken = await new Promise((resolve, reject) => {
                const containerId = 'google-login-btn-container';
                const timeoutMs = 20000;
                let finished = false;
                const timeout = setTimeout(() => {
                    if (finished) return;
                    finished = true;
                    reject(new Error('timeout'));
                }, timeoutMs);

                swal({
                    title: "Đăng nhập với Google",
                    text: "Chọn tài khoản Google của bạn",
                    content: {
                        element: "div",
                        attributes: { id: containerId }
                    },
                    buttons: {
                        cancel: "Hủy"
                    }
                }).then((dismissed) => {
                    if (dismissed === null && !finished) {
                        finished = true;
                        clearTimeout(timeout);
                        reject(new Error('cancelled'));
                    }
                });

                googleApi.initialize({
                    client_id: googleClientId,
                    callback: (response) => {
                        if (finished) return;
                        finished = true;
                        clearTimeout(timeout);
                        if (response?.credential) resolve(response.credential);
                        else reject(new Error('no_credential'));
                    },
                    auto_select: false,
                    cancel_on_tap_outside: true,
                });

                // Render Google's button inside SweetAlert
                setTimeout(() => {
                    const el = document.getElementById(containerId);
                    if (!el) return;
                    el.innerHTML = '';
                    googleApi.renderButton(el, {
                        theme: 'outline',
                        size: 'large',
                        text: 'signin_with',
                        shape: 'pill',
                        width: 280,
                    });
                }, 0);
            });

            const response = await fetch(`${apiBase}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            const json = await response.json();
            if (!response.ok) {
                swal("Error!", json.message || "Google sign in failed!", "error");
                setIsLoading(false);
                return;
            }

            const payload = json.data || json;
            const userData = {
                id: payload.user.id,
                email: payload.user.email,
                displayName: payload.user.full_name,
                photoURL: payload.user.photo || 'https://i.pravatar.cc/150?img=1',
                phone: payload.user.phone,
                role: payload.user.role,
            };

            localStorage.setItem('token', payload.access_token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            swal("Success!", "Signed in with Google!", "success");
            if (userData.role === 'ADMIN') history.push('/admin');
            else history.push('/');
        } catch (err) {
            const message =
                err?.message === 'cancelled'
                    ? 'Bạn đã hủy đăng nhập.'
                    : err?.message === 'timeout'
                        ? 'Google không trả về token. Thường do OAuth Client bị chặn origin (Authorized JavaScript origins).'
                        : 'Google sign in cancelled or failed';
            swal("Error!", message, "error");
        }
        setIsLoading(false);
    };

    // Logout
    const logOut = () => {
        clearStoredAuth();
        setUser(null);
        history.push('/');
    };

    const forceLoginAgain = () => {
        clearStoredAuth();
        setUser(null);
        history.push('/signin');
    };

    const updateUser = (updates) => {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const nextUser = { ...storedUser, ...user, ...updates };

        localStorage.setItem('user', JSON.stringify(nextUser));
        setUser(nextUser);
        return nextUser;
    };

    // Check if user is logged in
    const checkUser = () => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            setUser(null);
            return;
        }

        if (!hasValidStoredToken()) {
            clearStoredAuth();
            setUser(null);
            return;
        }

        try {
            setUser(JSON.parse(storedUser));
        } catch (error) {
            clearStoredAuth();
            setUser(null);
        }
    };

    return {
        user,
        isLoading,
        signUpUser,
        signInUser,
        signInWithGoogle,
        logOut,
        forceLoginAgain,
        checkUser,
        updateUser,
    };
};

export default useAuth;
