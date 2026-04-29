import React from 'react'
import { SignUp } from '@clerk/nextjs'

const SignUpPage = () => {
  return (
    <div className="flex justify-center py-10">
      <SignUp path="/sign-up" />
    </div>
  )
}

export default SignUpPage