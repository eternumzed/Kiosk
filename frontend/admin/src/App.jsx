import './App.css'
import { GoogleLogin } from '@react-oauth/google';

function App() {


  console.log(import.meta.env);

  return (
    <>

      <GoogleLogin
        onSuccess={(credentialResponse) => {
          console.log(credentialResponse);
        }}
        onError={() => {
          console.log('Login Failed');
        }}
      />

    </>
  )
}

export default App
