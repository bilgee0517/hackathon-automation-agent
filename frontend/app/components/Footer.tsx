export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
          <p className="text-sm text-gray-600">
            Powered by{' '}
            <a
              href="https://www.sanity.io"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Sanity
            </a>
            {' + '}
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Next.js
            </a>
          </p>
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Hackathon Dashboard
          </p>
        </div>
      </div>
    </footer>
  )
}
