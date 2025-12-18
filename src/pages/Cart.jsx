function Cart({ cartItems }) {
  if (cartItems.length === 0) {
    return <p style={{ textAlign: 'center' }}>Your cart is empty 🛒</p>
  }

  return (
    <div style={{ padding: '40px 20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        Your Cart
      </h2>

      {cartItems.map(item => (
        <div
          key={item.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}
        >
          <span>{item.name}</span>
          <span>₹{item.price}</span>
        </div>
      ))}
    </div>
  )
}

export default Cart
