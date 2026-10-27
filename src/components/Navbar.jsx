
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()
  const [loggedIn, setLoggedIn] = useState(
    () => Boolean(localStorage.getItem('token'))
  )

  useEffect(() => {
    const updateLoginStatus = () => {
      setLoggedIn(Boolean(localStorage.getItem('token')))
    }

    window.addEventListener('storage', updateLoginStatus)

    return () => {
      window.removeEventListener('storage', updateLoginStatus)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setLoggedIn(false)
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="text-2xl font-bold text-teal-600">
          DEV@Deakin
        </Link>

        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <input
            type="text"
            placeholder="Search..."
            aria-label="Search"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          <button
            type="button"
            className="bg-teal-600 text-white px-5 py-2 rounded-md hover:bg-teal-700"
          >
            Search
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/pricing"
            className="text-gray-700 px-3 py-2 hover:text-teal-600"
          >
            Pricing
          </Link>

          {loggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="border border-teal-600 text-teal-600 px-4 py-2 rounded-md hover:bg-teal-50"
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="border border-teal-600 text-teal-600 px-4 py-2 rounded-md hover:bg-teal-50"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700"
              >
                Sign Up
              </Link>
            </>
          )}

          <Link
            to="/signup"
            className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700"
          >
            Post
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

