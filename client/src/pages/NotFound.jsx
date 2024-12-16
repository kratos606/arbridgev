import React from 'react';

export default function NotFound() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md text-center">
          <h1 className="text-5xl font-bold text-gray-800">404</h1>
          <p className="mt-4 text-xl text-gray-600">Oops! Page not found.</p>
        </div>
      </div>
    );
}