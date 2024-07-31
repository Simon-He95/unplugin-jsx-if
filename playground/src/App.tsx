import { Route, Routes } from 'react-router-dom'
import './App.css'

import Test from './pages'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Test></Test>}></Route>
      </Routes>
    </>
  )
}

export default App
