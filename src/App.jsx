<Header onCartClick={() => setShowCart(!showCart)} />
import { useState, useEffect } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Shop from './pages/Shop'
import Cart from './pages/Cart'
import Home from './pages/Home'

function App() {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('pebbleco-cart')
    return savedCart ? JSON.parse(savedCart) : []
  })

  const [showCart, setShowCart] = useState(false)

  const addToCart = product => {
    setCart([...cart, product])
  }

  useEffect(() => {
    localStorage.setItem('pebbleco-cart', JSON.stringify(cart))
  }, [cart])

  return (
    <>
      <Header onCartClick={() => setShowCart(!showCart)} />

      <main>
        {showCart ? (
          <Cart cartItems={cart} />
        ) : (
          <Home/>
        )}
      </main>

      <Footer />
    </>
  )
}

export default App
