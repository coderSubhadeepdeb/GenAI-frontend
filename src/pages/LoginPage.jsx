import React from 'react';
import Login from '../components/Login';
import BubbleBackground from '../components/BubbleBackground';

const LoginPage = () => {
  return (
    <BubbleBackground interactive={true} className="flex items-center justify-center">
        <div className="w-screen h-screen flex justify-center items-center content-center bg-[#1f1f1f]">
            <Login/>
        </div>
    </BubbleBackground>
  )
}

export default LoginPage
