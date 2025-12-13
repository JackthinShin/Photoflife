import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2, RotateCw, Download, Info } from 'lucide-react';

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

const Lightbox = ({ activePhoto, photos, onClose, onNext, onPrev, onGoToIndex }) => {
  if (!activePhoto) return null;

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [fitScale, setFitScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const [rotation, setRotation] = useState(0);

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const dragMovedRef = useRef(false);
  const thumbnailRefs = useRef({});

  const photoIndex = photos.findIndex((p) => p.id === activePhoto.id);

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setNaturalSize({ width: 0, height: 0 });
    setRotation(0);
    // 滚动到当前缩略图
    setTimeout(() => {
      const thumbnailEl = thumbnailRefs.current[activePhoto.id];
      if (thumbnailEl) {
        thumbnailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 100);
  }, [activePhoto]);

  useEffect(() => {
    const img = new Image();
    img.src = activePhoto.src;
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
  }, [activePhoto.src]);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      setContainerSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!naturalSize.width || !naturalSize.height || !containerSize.width || !containerSize.height) return;
    const fit = Math.min(
      containerSize.width / naturalSize.width,
      containerSize.height / naturalSize.height
    );
    setFitScale(fit);
  }, [naturalSize, containerSize]);

  const computePanBounds = useCallback((targetScale = scale) => {
    if (!naturalSize.width || !naturalSize.height || !containerSize.width || !containerSize.height) {
      return { maxX: 0, maxY: 0 };
    }
    // 有效缩放（相对原图尺寸）= 适配比例 * 当前缩放
    const effectiveScale = fitScale * targetScale;
    const scaledWidth = naturalSize.width * effectiveScale;
    const scaledHeight = naturalSize.height * effectiveScale;
    return {
      maxX: Math.max(0, (scaledWidth - containerSize.width) / 2),
      maxY: Math.max(0, (scaledHeight - containerSize.height) / 2),
    };
  }, [containerSize, naturalSize, fitScale, scale]);

  useEffect(() => {
    const bounds = computePanBounds(scale);
    setPosition((pos) => ({
      x: clamp(pos.x, -bounds.maxX, bounds.maxX),
      y: clamp(pos.y, -bounds.maxY, bounds.maxY),
    }));
  }, [scale, computePanBounds]);

  const setScaleWithClamp = useCallback((updater) => {
    setScale((prev) => {
      const next = clamp(typeof updater === 'function' ? updater(prev) : updater, 0.5, 5);
      const bounds = computePanBounds(next);
      setPosition((pos) => ({
        x: clamp(pos.x, -bounds.maxX, bounds.maxX),
        y: clamp(pos.y, -bounds.maxY, bounds.maxY),
      }));
      return next;
    });
  }, [computePanBounds]);

  const resetTransform = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // 滚轮缩放（按住 Shift 键则平移）
    if (e.shiftKey && scale > 1) {
      // Shift + 滚轮 = 平移
      const bounds = computePanBounds(scale);
      setPosition((pos) => ({
        x: clamp(pos.x - e.deltaX * 0.5, -bounds.maxX, bounds.maxX),
        y: clamp(pos.y - e.deltaY * 0.5, -bounds.maxY, bounds.maxY),
      }));
    } else {
      // 普通滚轮 = 缩放
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setScaleWithClamp((prev) => prev + delta);
    }
  }, [setScaleWithClamp, scale, computePanBounds]);

  const handlePointerDown = useCallback((e) => {
    dragMovedRef.current = false;
    // 只在缩放状态大于1时才允许拖动
    if (scale > 1) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
  }, [scale]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging || scale <= 1) return;
    e.preventDefault();
    e.stopPropagation();
    const movementX = e.movementX || 0;
    const movementY = e.movementY || 0;
    if (Math.abs(movementX) > 2 || Math.abs(movementY) > 2) {
      dragMovedRef.current = true;
    }
    const bounds = computePanBounds(scale);
    setPosition((pos) => ({
      x: clamp(pos.x + movementX, -bounds.maxX, bounds.maxX),
      y: clamp(pos.y + movementY, -bounds.maxY, bounds.maxY),
    }));
  }, [isDragging, scale, computePanBounds]);

  const handlePointerEnd = useCallback((e) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch (_) {}
    const bounds = computePanBounds(scale);
    setPosition((pos) => ({
      x: clamp(pos.x, -bounds.maxX, bounds.maxX),
      y: clamp(pos.y, -bounds.maxY, bounds.maxY),
    }));
    // 重置拖动标志，允许下一次点击
    setTimeout(() => {
      dragMovedRef.current = false;
    }, 100);
  }, [isDragging, scale, computePanBounds]);

  const toggleZoom = useCallback((e) => {
    // 如果发生了拖动，不触发缩放
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    // 切换到原图 1:1（effectiveScale == 1），再切回适配
    const naturalScale = 1 / fitScale;
    if (Math.abs(scale - 1) < 1e-6) {
      setScaleWithClamp(() => naturalScale);
    } else {
      resetTransform();
    }
  }, [scale, fitScale, setScaleWithClamp, resetTransform]);

  const handleThumbnailClick = useCallback((index) => {
    if (onGoToIndex) {
      onGoToIndex(index);
    }
  }, [onGoToIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onNext();
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === '+' || e.key === '=') setScaleWithClamp((s) => s + 0.25);
      else if (e.key === '-' || e.key === '_') setScaleWithClamp((s) => s - 0.25);
      else if (e.key === '0') resetTransform();
      else if (e.key === 'r' || e.key === 'R') setRotation(prev => (prev + 90) % 360);
      else if (e.key === 'h' || e.key === 'H') setShowThumbnails(prev => !prev);
      else if (e.key === 'i' || e.key === 'I') setShowInfo(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, setScaleWithClamp, resetTransform]);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = activePhoto.src;
    link.download = activePhoto.title || 'photo';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [activePhoto]);

  const metaLine = useMemo(() => {
    if (!activePhoto) return '';
    return [
      activePhoto.camera,
      activePhoto.lens,
      activePhoto.focalLength ? `${activePhoto.focalLength}mm` : '',
      activePhoto.aperture ? `f/${activePhoto.aperture}` : '',
      activePhoto.shutter,
      activePhoto.iso ? `ISO${activePhoto.iso}` : '',
    ].filter(Boolean).join(' · ');
  }, [activePhoto]);

  const dateString = useMemo(() => {
    if (!activePhoto.takenAt && !activePhoto.date) return '';
    const date = new Date(activePhoto.takenAt || activePhoto.date);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [activePhoto]);

  const baseWidth = naturalSize.width ? naturalSize.width * fitScale : undefined;
  // 当有效缩放达到或超过原图（>=100%）时，优先用原图尺寸渲染，提升高倍缩放的清晰度
  const isAtLeastNative = naturalSize.width && naturalSize.height ? (fitScale * scale) >= 1 : false;
  const displayWidth = naturalSize.width ? (isAtLeastNative ? naturalSize.width : naturalSize.width * fitScale) : undefined;
  const transformScale = isAtLeastNative ? (fitScale * scale) : scale;
  const transform = `translate3d(${position.x}px, ${position.y}px, 0) scale(${transformScale}) rotate(${rotation}deg)`;
  const cursor = scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in';

  // 缩略图范围
  const thumbnailStart = Math.max(0, photoIndex - 5);
  const thumbnailEnd = Math.min(photos.length, photoIndex + 6);
  const visibleThumbnails = photos.slice(thumbnailStart, thumbnailEnd);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center z-50"
        onClick={(e) => {
          // 只在点击背景（容器）时关闭，不阻止图片上的事件
          if (e.target === e.currentTarget || e.target === containerRef.current) {
            onClose();
          }
        }}
      >
        <div 
          ref={containerRef} 
          className="relative w-full h-full flex items-center justify-center overflow-hidden p-4 md:p-8"
          onWheel={handleWheel}
        >
          <motion.img
            ref={imageRef}
            key={activePhoto.id}
            src={activePhoto.src}
            alt={activePhoto.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{
              width: displayWidth ? `${displayWidth}px` : 'auto',
              height: 'auto',
              maxWidth: isAtLeastNative ? 'none' : '100%',
              maxHeight: isAtLeastNative ? 'none' : '100%',
              transform,
              transition: isDragging ? 'transform 0s' : 'transform 0.2s ease-out',
              cursor,
              userSelect: 'none',
              WebkitUserSelect: 'none',
              willChange: 'transform',
              imageRendering: 'auto',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}
            draggable={false}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerLeave={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onClick={toggleZoom}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              resetTransform();
            }}
          />
        </div>

        {/* 顶部控制栏 */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-2">
              <button
                onClick={() => setScaleWithClamp((s) => s - 0.25)}
                className="text-white hover:text-gray-300 transition-colors p-1"
                title="缩小 ( - )"
              >
                <ZoomOut size={18} />
              </button>
              <span className="text-white text-sm tabular-nums min-w-[3rem] text-center" title={`相对于原图：${(fitScale * scale * 100).toFixed(0)}%`}>
                {(fitScale * scale * 100).toFixed(0)}%
              </span>
              <button
                onClick={() => setScaleWithClamp((s) => s + 0.25)}
                className="text-white hover:text-gray-300 transition-colors p-1"
                title="放大 ( + )"
              >
                <ZoomIn size={18} />
              </button>
            </div>
            <button
              onClick={resetTransform}
              className="bg-black/60 backdrop-blur-md rounded-full p-2 text-white hover:bg-black/80 transition-colors"
              title="重置 ( 0 )"
            >
              <Maximize2 size={18} />
            </button>
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="bg-black/60 backdrop-blur-md rounded-full p-2 text-white hover:bg-black/80 transition-colors"
              title="旋转 ( R )"
            >
              <RotateCw size={18} />
            </button>
            <button
              onClick={handleDownload}
              className="bg-black/60 backdrop-blur-md rounded-full p-2 text-white hover:bg-black/80 transition-colors"
              title="下载"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => setShowInfo(prev => !prev)}
              className={`rounded-full p-2 transition-colors ${showInfo ? 'bg-accent/80 text-white' : 'bg-black/60 text-white hover:bg-black/80'}`}
              title="切换信息 ( I )"
            >
              <Info size={18} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-black/60 backdrop-blur-md rounded-full px-4 py-2 text-white text-sm">
              {photoIndex + 1} / {photos.length}
            </div>
            <button
              onClick={onClose}
              className="bg-black/60 backdrop-blur-md rounded-full p-2 text-white hover:bg-red-500/80 transition-colors"
              title="关闭 ( ESC )"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 左右导航按钮 */}
        {photoIndex > 0 && (
          <button
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white rounded-full p-3 md:p-4 transition-all hover:scale-110"
            title="上一张 ( ← )"
          >
            <ChevronLeft size={28} />
          </button>
        )}
        {photoIndex < photos.length - 1 && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white rounded-full p-3 md:p-4 transition-all hover:scale-110"
            title="下一张 ( → )"
          >
            <ChevronRight size={28} />
          </button>
        )}

        {/* 底部信息栏 */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 md:p-6 text-white"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
            >
              <div className="container mx-auto">
                <h3 className="text-xl md:text-2xl font-serif font-semibold mb-2">{activePhoto.title}</h3>
                {metaLine && (
                  <p className="text-sm md:text-base text-gray-300 mb-1">{metaLine}</p>
                )}
                {dateString && (
                  <p className="text-xs md:text-sm text-gray-400">{dateString}</p>
                )}
                {activePhoto.album && (
                  <p className="text-xs md:text-sm text-gray-400 mt-1">相册: {activePhoto.album}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 缩略图导航 */}
        <AnimatePresence>
          {showThumbnails && photos.length > 1 && (
            <motion.div
              className="absolute bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md rounded-full px-3 py-2 max-w-[90vw] overflow-x-auto"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="flex items-center gap-2">
                {visibleThumbnails.map((photo, idx) => {
                  const actualIndex = thumbnailStart + idx;
                  const isActive = actualIndex === photoIndex;
                  return (
                    <button
                      key={photo.id}
                      ref={(el) => {
                        if (el) thumbnailRefs.current[photo.id] = el;
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleThumbnailClick(actualIndex);
                      }}
                      className={`relative flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                        isActive
                          ? 'ring-2 ring-accent scale-110 opacity-100'
                          : 'opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <img
                        src={photo.src}
                        alt={photo.title}
                        className="w-12 h-12 md:w-16 md:h-16 object-cover"
                        loading="lazy"
                      />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 快捷键提示 */}
        <div className="absolute bottom-2 right-4 text-xs text-gray-400 hidden md:block">
          按 H 切换缩略图，I 切换信息，R 旋转，ESC 关闭
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Lightbox;