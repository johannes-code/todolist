import Link from "next/link";

export default function Custom404() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      {/* Left: bouncing 404 */}
      <div className="flex md:flex-col items-center justify-center space-x-2 md:space-x-0 md:space-y-2 mr-6">
        <h1
          className="text-6xl font-extrabold text-purple-500 animate-bounce"
          style={{ animationDelay: "0s" }}
        >
          4
        </h1>
        <h1
          className="text-6xl font-extrabold text-purple-500 animate-bounce"
          style={{ animationDelay: "0.5s" }}
        >
          0
        </h1>
        <h1
          className="text-6xl font-extrabold text-purple-500 animate-bounce"
          style={{ animationDelay: "0.5s" }}
        >
          4
        </h1>
      </div>

      {/* Center: Image */}
      <div className="flex justify-center md:justify-center w-full md:w-1/2 max-w-sm mb-8 md:mb-0">
        <img
          src="/assets/jackson-simmer-ZxRHtPacwUY-unsplash.jpg"
          alt="Page broken"
          className="rounded-lg shadow-lg"
        />
      </div>

      {/* Right: Text */}
      <div className="flex flex-col items-center md:items-start text-center md:text-left md:ml-8 max-w-md">
        <p className="text-2xl text-gray-300 mb-2">
          Uh oh! This page took a vacation 🏖️
        </p>
        <p className="text-lg text-gray-400 mb-6">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-purple-700 transition transform hover:scale-105"
        >
          🏠 Take me home
        </Link>
      </div>
    </div>
  );
}
