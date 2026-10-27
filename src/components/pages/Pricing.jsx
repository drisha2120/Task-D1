
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Pricing() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const isPaid = user?.subscription === 'Paid'

  const handleUpgrade = () => {
    setMessage('')

    if (!token || !user) {
      navigate('/login')
      return
    }

    if (isPaid) {
      setMessage('You already have a Paid subscription.')
      return
    }

    setShowModal(true)
  }

  const handlePaymentSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    if (!token || !user) {
      navigate('/login')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:3000/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMethod: 'demo',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message || 'Upgrade failed. Please try again.')
        return
      }

      const updatedUser = {
        ...user,
        subscription: 'Paid',
      }

      localStorage.setItem('user', JSON.stringify(updatedUser))
      setShowModal(false)
      setMessage('Your subscription is now Paid!')
      window.location.reload()
    } catch (error) {
      console.error('Upgrade error:', error)
      setMessage('Could not connect to the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-teal-600 mb-3">
          Choose Your Plan
        </h1>

        <p className="text-center text-gray-600 mb-10">
          Choose the plan that suits your DEV@Deakin journey.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold mb-2">Free</h2>
            <p className="text-3xl font-bold mb-6">$0</p>

            <ul className="space-y-3 text-gray-700 mb-8">
              <li>✓ Browse community content</li>
              <li>✓ Create an account</li>
              <li>✓ Access standard features</li>
            </ul>

            <p className="font-semibold text-teal-600">
              {user ? (isPaid ? 'Included in your Paid plan' : 'Your current plan') : 'Available to everyone'}
            </p>
          </section>

          <section className="bg-white rounded-xl shadow-md border-2 border-teal-500 p-8">
            <h2 className="text-2xl font-bold mb-2">Paid</h2>
            <p className="text-3xl font-bold mb-6">
              Premium
            </p>

            <ul className="space-y-3 text-gray-700 mb-8">
              <li>✓ Everything in Free</li>
              <li>✓ Premium member status</li>
              <li>✓ Access to paid-plan features</li>
            </ul>

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loading || isPaid}
              className="w-full bg-teal-600 text-white rounded-lg p-3 hover:bg-teal-700 disabled:opacity-50"
            >
              {isPaid ? 'Already Paid' : 'Upgrade to Paid'}
            </button>
          </section>
        </div>

        {message && (
          <p className="text-center mt-6 text-teal-700" role="status">
            {message}
          </p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-teal-600 mb-3">
              Upgrade Subscription
            </h2>

            <p className="text-gray-600 mb-6">
              This is a demonstration upgrade. No real payment will be taken.
            </p>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <p className="text-sm text-gray-600">
                Confirm that you want to upgrade your account to the Paid plan.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 text-white rounded-lg p-3 hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm Demo Upgrade'}
              </button>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full border border-gray-300 rounded-lg p-3 hover:bg-gray-50"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default Pricing
