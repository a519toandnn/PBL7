import React, { useState } from 'react'
import Bounce from 'react-reveal/Bounce'
import { Link } from 'react-router-dom'
import TextField from '../components/Form/TextField'
import useAuth from '../hooks/useAuth'
import GoogleSignIn from '../components/Form/GoogleSignIn'

const SignUpScreen = () => {
    const [userInput, setUserInput] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    })
    const { signUpUser, isLoading, signInWithGoogle } = useAuth()

    //form inputs
    const Inputs = [
        { id: 1, type: "text", placeholder: "Họ và tên", value: `${userInput.full_name}`, name: 'full_name' },
        { id: 2, type: "email", placeholder: "Email", value: `${userInput.email}`, name: 'email' },
        { id: 3, type: "tel", placeholder: "Số điện thoại", value: `${userInput.phone}`, name: 'phone' },
        { id: 4, type: "password", placeholder: "Mật khẩu", value: `${userInput.password}`, name: 'password' },
        { id: 5, type: "password", placeholder: "Xác nhận mật khẩu", value: `${userInput.confirmPassword}`, name: 'confirmPassword' },
    ]

    //handle change 
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
        
        // Validate
        if (!userInput.full_name || !userInput.email || !userInput.password) {
            alert('Vui lòng điền đầy đủ thông tin');
            return;
        }
        
        if (userInput.password !== userInput.confirmPassword) {
            alert('Mật khẩu không khớp');
            return;
        }
        
        await signUpUser(userInput.email, userInput.password, userInput.full_name, userInput.phone)
    }

    return (
        <main className="h-screen w-full banner">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
                {/* form  */}
                <Bounce left>
                    <div className="flex flex-col justify-center items-center h-screen">
                        {/* sign up form  */}
                        <form className="bg-white w-96 mt-6 p-6 rounded-lg shadow-lg" onSubmit={handleSubmit}>
                            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Đăng Ký</h2>
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
                                {isLoading ? 'Đang đăng ký...' : 'Đăng Ký'}
                            </button>
                            <Link to="/signin">
                                <p className="text-base text-primary text-center my-6 hover:underline">Đã có tài khoản? Đăng nhập ngay</p>
                            </Link>

                            <GoogleSignIn
                                text="Đăng nhập với Google"
                                onClick={signInWithGoogle}
                                disabled={!process.env.REACT_APP_GOOGLE_CLIENT_ID}
                            />
                        </form>
                    </div>
                </Bounce>

                {/* image  */}
                <Bounce right>
                    <div className="hidden md:flex lg:flex flex-col justify-center items-center w-full h-screen">
                        <img className="w-4/4 mx-auto" src="../../assets/signup.png" alt="signup" />
                    </div>
                </Bounce>
            </div>
        </main>
    )
}

export default SignUpScreen
