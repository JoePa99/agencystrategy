// pages/404.tsx
import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          404 - Page Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The page you are looking for might have been removed or is temporarily unavailable.
        </p>
        <Link href="/">
          <span className="inline-block bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">
            Go back home
          </span>
        </Link>
      </div>
    </div>
  );
}