import React from 'react'
import { Camera, Github } from 'lucide-react'

export default function Header() {
  return (
    <header className="border-b bg-white/70 backdrop-blur">
      <div className="container flex items-center justify-between h-16">
        <a href="/" className="flex items-center gap-2 font-semibold">
          <Camera className="w-6 h-6 text-accent" />
          <span>Photoflife</span>
        </a>
        <nav className="flex items-center gap-4">
          <a href="#" className="hover:text-accent">作品集</a>
          <a href="#" className="hover:text-accent">关于我</a>
          <a href="https://github.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 subtle hover:text-accent">
            <Github className="w-5 h-5" />
            GitHub
          </a>
        </nav>
      </div>
    </header>
  )
}
