import React from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import PhotoGrid from './components/PhotoGrid'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="portfolio" className="flex-1 container py-8 md:py-12 space-y-8">
        <section className="space-y-6 animate-fade-in">
          <div className="text-center space-y-3 mb-8">
            <h1 className="section-title text-4xl md:text-5xl lg:text-6xl leading-tight pb-1">
              精选作品
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg">
              记录生活中的美好瞬间，每一张照片都是时光的见证
            </p>
          </div>
          <PhotoGrid />
        </section>
        <section id="about" className="mt-20 py-16 border-t border-gray-200">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="section-title text-3xl md:text-4xl">关于我</h2>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed">
              我是一位热爱摄影的创作者，用镜头捕捉生活中的美好瞬间。
              每一张照片都承载着独特的记忆和情感，希望能够通过作品与你分享这些珍贵的时刻。
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
