import React from 'react';

export default function ErrorPage() {
    return (
        <div className="h-screen flex flex-col justify-center items-center">
            <p className="font-bold text-3xl text-black">Oops!</p>
            <p className="font-medium text-lg text-gray-400">Sorry, result not found</p>
        </div>
    );
}