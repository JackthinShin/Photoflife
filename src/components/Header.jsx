import React from 'react'
import { Camera, Github, Sparkles } from 'lucide-react'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="container flex items-center justify-between h-16 md:h-20">
        <a 
          href="/" 
          className="flex items-center gap-2.5 font-bold text-lg md:text-xl group transition-transform hover:scale-105"
        >
          <div className="relative">
            <Camera className="w-6 h-6 md:w-7 md:h-7 text-accent transition-colors group-hover:text-accent-dark" />
            <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400 animate-pulse" />
          </div>
          <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Photoflife
          </span>
        </a>
        <nav className="flex items-center gap-3 md:gap-6">
          <a 
            href="#portfolio" 
            className="text-sm md:text-base font-medium text-gray-700 hover:text-accent transition-colors relative group"
          >
            作品集
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
          </a>
          <a 
            href="#about" 
            className="text-sm md:text-base font-medium text-gray-700 hover:text-accent transition-colors relative group"
          >
            关于我
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
          </a>
          <a 
            href="https://github.com/JackthinShin" 
            target="_blank" 
            rel="noreferrer" 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
          >
            <Github className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </nav>
      </div>
    </header>
  )
}
