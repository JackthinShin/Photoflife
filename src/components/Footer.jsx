import React from 'react'
import { Heart, Coffee } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-16 md:mt-20 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50/50">
      <div className="container py-8 md:py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>© {new Date().getFullYear()} Photoflife</span>
            <span className="mx-1">·</span>
            <span>摄影分享网站</span>
          </div>
          <div className="flex items-center gap-4 text-xs md:text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            </div>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">React + Vite + Tailwind</span>
            <span className="hidden sm:inline">·</span>
            <a 
              href="https://github.com/JackthinShin" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-accent transition-colors inline-flex items-center gap-1"
            >
              <Coffee className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
