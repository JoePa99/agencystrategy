// pages/_error.tsx
import { NextPage } from 'next';
import Link from 'next/link';

interface ErrorProps {
  statusCode?: number;
}

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          {statusCode ? `Error ${statusCode}` : 'An error occurred'}
        </h1>
        <p className="text-gray-600 mb-6">
          {statusCode
            ? `A server-side error occurred.`
            : 'An error occurred on client'}
        </p>
        <Link href="/">
          <span className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Go back home
          </span>
        </Link>
      </div>
    </div>
  );
};

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;