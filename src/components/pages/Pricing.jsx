

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Pricing() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const token = localStorage.getItem('token')

  let user = null
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    user = null
  }

  const isLoggedIn = Boolean(token && user)
  const isPaid = user?.subscription === 'Paid'

  const handleUpgrade = () => {
    setMessage('')

    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    if (isPaid) {
      setMessage('You are already on the Paid plan.')
      return
    }

    setShowModal(true)
  }

  const handlePaymentSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    if (!isLoggedIn) {
      setShowModal(false)
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
        body: JSON.stringify({ paymentMethod: 'demo' }),
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
      window.dispatchEvent(new Event('authChanged'))

      setShowModal(false)
      setMessage('Your subscription has been upgraded to Paid!')
    } catch (error) {
      console.error('Upgrade error:', error)
      setMessage('Could not connect to the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-12 sm:py-16">
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 mb-3">
          Membership
        </p>

        <h1 className="text-4xl sm:text-5xl font-bold text-center text-gray-900 mb-4">
          Our Pricing Plans
        </h1>

        <p className="text-center text-gray-500 mb-12">
          Choose the plan that suits your learning needs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 max-w-3xl mx-auto items-stretch">
          {/* Free plan */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 sm:p-8 flex flex-col">
            <h2 className="text-xl font-bold text-gray-900">Free Plan</h2>
            <p className="text-sm text-gray-500 mt-2">
              A good place to start.
            </p>

            <div className="mt-5 mb-6">
              <span className="text-4xl font-bold text-gray-900">£0</span>
              <span className="text-sm text-gray-500"> / forever</span>
            </div>

            <ul className="space-y-4 text-sm text-gray-700 flex-1 mb-8">
              <li>✓ Browse community posts</li>
              <li>✓ Save up to 5 posts</li>
              <li>✓ General learning feed</li>
              <li>✓ Standard profile</li>
            </ul>

            <div className={`rounded-lg py-3 px-4 text-center text-sm font-semibold ${
              isLoggedIn && !isPaid
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {isLoggedIn && !isPaid
                ? 'Current Plan'
                : isPaid
                  ? 'Included in Paid Plan'
                  : 'Free Plan'}
            </div>
          </section>

          {/* Paid plan */}
          <section className="relative bg-white rounded-2xl border-2 border-violet-500 shadow-lg p-7 sm:p-8 flex flex-col">
            <span className="absolute -top-3 left-6 rounded-full bg-violet-600 text-white text-xs font-bold uppercase tracking-wide px-3 py-1">
              Recommended
            </span>

            <h2 className="text-xl font-bold text-gray-900 mt-2">
              Paid Plan
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              Get more from your learning experience.
            </p>

            <div className="mt-5 mb-6">
              <span className="text-4xl font-bold text-gray-900">£18.45</span>
              <span className="text-sm text-gray-500"> / month</span>
            </div>

            <ul className="space-y-4 text-sm text-gray-700 flex-1 mb-8">
              <li>✓ Everything in the Free plan</li>
              <li>✓ Unlimited saved posts</li>
              <li>✓ Priority post visibility</li>
              <li>✓ Personal learning feed</li>
              <li>✓ Premium user profile</li>
            </ul>

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loading || isPaid}
              className={`w-full rounded-lg px-4 py-3 font-semibold transition ${
                isPaid
                  ? 'bg-emerald-100 text-emerald-800 cursor-default'
                  : 'bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50'
              }`}
            >
              {isPaid
                ? 'Current Plan'
                : loading
                  ? 'Processing...'
                  : 'Upgrade Plan'}
            </button>
          </section>
        </div>

        {message && (
          <p
            role="status"
            className="text-center mt-6 text-sm font-medium text-teal-700"
          >
            {message}
          </p>
        )}
      </div>

      {/* Demo upgrade modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          onClick={(event) => {
            if (event.target === event.currentTarget && !loading) {
              setShowModal(false)
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-title"
            className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-2">
              Paid membership
            </p>

            <h2
              id="upgrade-title"
              className="text-2xl font-bold text-gray-900 mb-2"
            >
              Upgrade to Paid
            </h2>

            <p className="text-sm text-gray-500 mb-5">
              £18.45 / month
            </p>

            <div className="rounded-lg bg-violet-50 p-4 text-sm text-violet-900 mb-6">
              This is a demonstration upgrade. No real payment will be taken,
              and you should not enter real card details.
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Confirm below to update your subscription in Firestore.
            </p>

            <form onSubmit={handlePaymentSubmit} className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm Demo Upgrade'}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setShowModal(false)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

export default Pricing
