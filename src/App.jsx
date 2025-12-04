import React from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import PhotoGrid from './components/PhotoGrid'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 space-y-8">
        <section className="space-y-4">
          <h2 className="section-title">精选作品</h2>
          <p className="subtle">把你的照片放到 <code>public/photos</code> 文件夹，并在 <code>src/data/photos.js</code> 里登记即可显示。</p>
          <PhotoGrid />
        </section>
      </main>
      <Footer />
    </div>
  )
}
