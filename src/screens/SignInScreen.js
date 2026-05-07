import React, { useState } from 'react'
import Bounce from 'react-reveal/Bounce'
import { Link } from 'react-router-dom'
import TextField from '../components/Form/TextField'
import useAuth from '../hooks/useAuth'
import GoogleSignIn from '../components/Form/GoogleSignIn'

const SignInScreen = () => {
    const [userInput, setUserInput] = useState({
        email: '',
        password: '',
    })
    const { signInUser, signInWithGoogle, isLoading, user } = useAuth()

    // handle change
    const handleChange = (e) => {
        const { value, name } = e.target;
        setUserInput(prev => {
            return {
                ...prev,
                [name]: value
            }
        })
    }

    //handle submit form 
    const handleSubmit = async (e) => {
        e.preventDefault();
        await signInUser(userInput.email, userInput.password)
    }

    //form inputs
    const Inputs = [
        { id: 1, type: "email", placeholder: "Email", value: `${userInput.email}`, name: 'email' },
        { id: 2, type: "password", placeholder: "Mật khẩu", value: `${userInput.password}`, name: 'password' },
    ]

    return (
        <main className="h-screen w-full banner">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
                {/* image  */}
                <Bounce left>
                    <div className="hidden md:flex lg:flex flex-col justify-center items-center w-full h-screen">
                        <img className="w-4/4 mx-auto" src="../../assets/signin.png" alt="signin" />
                    </div>
                </Bounce>

                {/* form  */}
                <Bounce right>
                    <div className="flex flex-col justify-center items-center h-screen">
                        {/* sign in form  */}
                        <form className="bg-white w-3/5 mt-6 p-6 rounded-lg shadow-lg" onSubmit={handleSubmit}>
                            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Đăng Nhập</h2>
                            {user?.email && (
                                <p className="text-center text-sm text-gray-500 mb-4">
                                    Bạn đang đăng nhập với: <span className="font-semibold">{user.email}</span>
                                </p>
                            )}
                            <div className="flex flex-col space-y-4">
                                {Inputs.map(input => (
                                    <TextField
                                        key={input.id}
                                        type={input.type}
                                        placeholder={input.placeholder}
                                        value={input.value}
                                        name={input.name}
                                        onChange={handleChange}
                                    />
                                ))}
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition duration-300 mt-6"
                            >
                                {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                            </button>

                            <Link to="/signup">
                                <p className="text-base text-primary text-center my-6 hover:underline">Chưa có tài khoản? Đăng ký ngay</p>
                            </Link>

                            <GoogleSignIn
                                text="Đăng nhập với Google"
                                onClick={signInWithGoogle}
                                disabled={!process.env.REACT_APP_GOOGLE_CLIENT_ID}
                            />
                        </form>
                    </div>
                </Bounce>
            </div>
        </main>
    )
}

export default SignInScreen
