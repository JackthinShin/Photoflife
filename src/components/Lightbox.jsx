import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

const Lightbox = ({ activePhoto, photos, onClose, onNext, onPrev }) => {
  if (!activePhoto) return null;

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [fitScale, setFitScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const dragMovedRef = useRef(false);

  const photoIndex = photos.findIndex((p) => p.id === activePhoto.id);

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setNaturalSize({ width: 0, height: 0 });
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
      const next = clamp(typeof updater === 'function' ? updater(prev) : updater, 1, 5);
      const bounds = computePanBounds(next);
      setPosition((pos) => ({
        x: clamp(pos.x, -bounds.maxX, bounds.maxX),
        y: clamp(pos.y, -bounds.maxY, bounds.maxY),
      }));
      return next;
    });
  }, [computePanBounds]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScaleWithClamp((prev) => prev + delta);
  }, [setScaleWithClamp]);

  const handlePointerDown = useCallback((e) => {
    dragMovedRef.current = false;
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, [scale]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging || scale <= 1) return;
    e.preventDefault();
    if (Math.abs(e.movementX) > 0 || Math.abs(e.movementY) > 0) {
      dragMovedRef.current = true;
    }
    const bounds = computePanBounds(scale);
    setPosition((pos) => ({
      x: clamp(pos.x + e.movementX, -bounds.maxX, bounds.maxX),
      y: clamp(pos.y + e.movementY, -bounds.maxY, bounds.maxY),
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
  }, [isDragging, scale, computePanBounds]);

  const toggleZoom = useCallback((e) => {
    if (dragMovedRef.current) return;
    e.preventDefault();
    if (scale === 1) {
      setScaleWithClamp(() => 2);
    } else {
      setPosition({ x: 0, y: 0 });
      setScaleWithClamp(() => 1);
    }
  }, [scale, setScaleWithClamp]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onNext();
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === '+' || e.key === '=') setScaleWithClamp((s) => s + 0.25);
      else if (e.key === '-' || e.key === '_') setScaleWithClamp((s) => s - 0.25);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, setScaleWithClamp]);

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

  const baseWidth = naturalSize.width ? naturalSize.width * fitScale : undefined;
  const transform = `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`;
  const cursor = scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-50"
        onWheel={handleWheel}
      >
        <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <motion.img
            ref={imageRef}
            key={activePhoto.id}
            src={activePhoto.src}
            alt={activePhoto.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.2, ease: 'easeInOut' } }}
            style={{
              width: baseWidth ? `${baseWidth}px` : 'auto',
              height: 'auto',
              transform,
              transition: isDragging ? 'transform 0s' : 'transform 0.2s ease-out',
              cursor,
            }}
            draggable={false}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerLeave={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onClick={toggleZoom}
            onDoubleClick={toggleZoom}
          />
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/50 rounded-full px-3 py-1">
            <button onClick={() => setScaleWithClamp((s) => s - 0.25)} className="text-white hover:text-gray-300"><ZoomOut size={20} /></button>
            <span className="text-white text-sm tabular-nums">{(scale * 100).toFixed(0)}%</span>
            <button onClick={() => setScaleWithClamp((s) => s + 0.25)} className="text-white hover:text-gray-300"><ZoomIn size={20} /></button>
          </div>
          <button onClick={onClose} className="bg-black/50 rounded-full p-2 text-white hover:bg-black/70">
            <X size={24} />
          </button>
        </div>

        {photoIndex > 0 && (
          <button onClick={onPrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-3">
            <ChevronLeft size={32} />
          </button>
        )}
        {photoIndex < photos.length - 1 && (
          <button onClick={onNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-3">
            <ChevronRight size={32} />
          </button>
        )}

        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white text-center"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
        >
          <h3 className="text-2xl font-serif">{activePhoto.title}</h3>
          <p className="text-sm text-gray-300 mt-1">{metaLine}</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Lightbox;