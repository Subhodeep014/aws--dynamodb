import { useEffect, useState } from 'react'
import Register from './components/Register'


function App() {
  const [count, setCount] = useState(0)
  useEffect(()=>{
    const fetchData = async()=>{
      try {
        const res = await fetch('/api/register/new', {
          method : "GET",
          "Content-Type" : "application/json"
        })
        if(res.ok){
          const data = await res.json(res);
          console.log(data)
        }

      } catch (error) {4
        console.log(error);
      }
    }
    fetchData();
  })

  return (
    <>
    <Register/> 
    </>
  )
}

export default App
