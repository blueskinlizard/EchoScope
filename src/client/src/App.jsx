import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import FileUploader from './Components/FileUploader'

function App() {

  return (
    <>
      <h1>Echoscope Homepage</h1>
      <FileUploader></FileUploader>
    </>
  )
}

export default App
