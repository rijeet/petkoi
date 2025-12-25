'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            About Us
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 mx-auto rounded-full"></div>
        </div>

        {/* Main Content */}
        <div className="space-y-8 text-cyan-100 leading-relaxed">
          {/* Opening Statement */}
          <section className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-pink-500/30 shadow-xl">
            <p className="text-lg sm:text-xl leading-relaxed">
              <span className="text-2xl font-bold text-pink-300">Pets are not just animals — they are family.</span>
            </p>
            <p className="mt-4 text-base sm:text-lg">
              This platform was born from a very personal and emotional experience. One day, my own pet went missing. For more than 24 hours, my heart was filled with fear, helplessness, and hope. I searched everywhere with all my strength and soul. When I finally found him, safe and alive, it changed me forever.
            </p>
            <p className="mt-4 text-base sm:text-lg">
              At that moment, I made a promise — <span className="text-pink-300 font-semibold">no pet should be lost without hope, and no family should feel that pain alone.</span>
            </p>
            <p className="mt-4 text-base sm:text-lg font-semibold text-cyan-300">
              That promise became this website.
            </p>
          </section>

          {/* Our Mission */}
          <section className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-pink-500/30 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
              Our Mission
            </h2>
            <p className="mb-4 text-base sm:text-lg">
              We built this platform to help:
            </p>
            <ul className="space-y-3 text-base sm:text-lg">
              <li className="flex items-start gap-3">
                <span className="text-2xl">🐶</span>
                <span>Register pets with a unique QR ID</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">🔍</span>
                <span>Help lost pets find their way back home</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">💉</span>
                <span>Store vaccination and health history securely</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">❤️</span>
                <span>Create a trusted space for pet lovers</span>
              </li>
            </ul>
            <p className="mt-6 text-base sm:text-lg italic text-pink-200">
              If someone finds a lost pet, a simple QR scan can connect them to the owner instantly — saving time, stress, and sometimes lives.
            </p>
          </section>

          {/* Why We Do This */}
          <section className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-pink-500/30 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
              Why We Do This
            </h2>
            <p className="mb-4 text-base sm:text-lg">
              We believe:
            </p>
            <ul className="space-y-3 text-base sm:text-lg mb-6">
              <li className="flex items-start gap-3">
                <span className="text-pink-400 font-bold">•</span>
                <span>Pets are lifelong companions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-pink-400 font-bold">•</span>
                <span>Every pet deserves safety and care</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-pink-400 font-bold">•</span>
                <span>Technology can bring families back together</span>
              </li>
            </ul>
            <p className="text-base sm:text-lg font-semibold text-cyan-300">
              This platform is built by pet lovers, for pet lovers.
            </p>
          </section>

          {/* Community & Support */}
          <section className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-pink-500/30 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
              Community & Support
            </h2>
            <p className="mb-4 text-base sm:text-lg">
              Currently, our service runs on a free server, and we are doing our best to keep it accessible for everyone. To continue improving the platform and to help more lost pets return home, we rely on donations and community support.
            </p>
            <p className="mb-4 text-base sm:text-lg font-semibold text-pink-300">
              Every contribution helps us:
            </p>
            <ul className="space-y-2 text-base sm:text-lg mb-6">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400">✓</span>
                <span>Keep the service running</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400">✓</span>
                <span>Improve features</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400">✓</span>
                <span>Support more pets and families</span>
              </li>
            </ul>
          </section>

          {/* A Shared Hope */}
          <section className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-pink-500/30 shadow-xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
              A Shared Hope
            </h2>
            <p className="text-lg sm:text-xl leading-relaxed mb-4">
              This is more than a website —<br />
              it's a shared hope, a safety net, and a small step toward a world where no pet stays lost.
            </p>
            <p className="text-xl sm:text-2xl font-bold text-pink-300 mt-6">
              Thank you for being part of this journey. 🐾💙
            </p>
          </section>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-lg hover:from-cyan-600 hover:to-pink-600 transition-all duration-300 shadow-[0_0_15px_rgba(236,72,153,0.6)] hover:shadow-[0_0_20px_rgba(236,72,153,0.8)] font-medium text-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

