import React from 'react'

export default function Footer() {
  return (
    <footer className="mt-8 border-t">
      <div className="container py-8 text-sm subtle">
        <p>© {new Date().getFullYear()} Photoflife · 摄影分享网站
          <span className="mx-2">·</span>
          使用 React + Vite + Tailwind · 部署在 GitHub Pages
        </p>
      </div>
    </footer>
  )
}
