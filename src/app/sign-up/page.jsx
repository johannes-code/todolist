import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return(
   <div className='felx justify-center items-center h-screen'>
   <SignUp fallbackRedirectUrl='/' />
   </div>
  )  
}