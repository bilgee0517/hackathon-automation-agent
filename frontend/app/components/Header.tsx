import Link from 'next/link'

export default function Header() {
  return (
    <header className="fixed z-50 h-16 inset-x-0 top-0 bg-white/80 flex items-center backdrop-blur-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link className="flex items-center gap-2" href="/">
            <span className="text-xl font-bold text-gray-900">
              Hackathon Dashboard
            </span>
          </Link>

          <nav>
            <ul className="flex items-center gap-6">
              <li>
                <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">
                  Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Submit Project
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}
