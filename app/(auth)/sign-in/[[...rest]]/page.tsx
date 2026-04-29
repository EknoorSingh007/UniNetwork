import React from 'react'
import { SignIn } from '@clerk/nextjs'

const SignInPage = () => {
  return (
    <div className="flex justify-center py-10">
      <SignIn path="/sign-in" />
    </div>
  )
}

export default SignInPage