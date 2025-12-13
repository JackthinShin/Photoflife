import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image as ImageIcon, List, SlidersHorizontal, Search, X, Filter, Calendar, Folder } from 'lucide-react';
import photos from '../data/photos';
import Lightbox from './Lightbox';

const PhotoGrid = () => {
  const [view, setView] = useState('grid'); // grid, album, timeline
  const [lightboxState, setLightboxState] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [imageLoadStates, setImageLoadStates] = useState({});

  // 获取所有相册列表
  const albums = useMemo(() => {
    return photos.reduce((acc, p) => {
      const albumName = p.album || '未分类';
      if (!acc[albumName]) acc[albumName] = [];
      acc[albumName].push(p);
      return acc;
    }, {});
  }, [photos]);

  // 获取所有年份列表
  const years = useMemo(() => {
    const yearSet = new Set();
    photos.forEach(photo => {
      const date = photo.takenAt || photo.date;
      if (date) {
        const year = new Date(date).getFullYear();
        yearSet.add(year);
      }
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [photos]);

  // 筛选照片
  const filteredPhotos = useMemo(() => {
    let result = [...photos];

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(photo => 
        photo.title?.toLowerCase().includes(query) ||
        photo.camera?.toLowerCase().includes(query) ||
        photo.album?.toLowerCase().includes(query) ||
        photo.lens?.toLowerCase().includes(query)
      );
    }

    // 相册筛选
    if (selectedAlbum) {
      result = result.filter(photo => (photo.album || '未分类') === selectedAlbum);
    }

    // 年份筛选
    if (selectedYear) {
      result = result.filter(photo => {
        const date = photo.takenAt || photo.date;
        if (!date) return false;
        return new Date(date).getFullYear().toString() === selectedYear;
      });
    }

    return result;
  }, [searchQuery, selectedAlbum, selectedYear]);

  const orderedPhotos = useMemo(() => {
    return filteredPhotos;
  }, [filteredPhotos]);

  const timelinePhotos = useMemo(() => {
    return [...filteredPhotos].sort((a, b) => {
      const aDate = a.takenAt || a.date || '';
      const bDate = b.takenAt || b.date || '';
      return new Date(bDate) - new Date(aDate);
    });
  }, [filteredPhotos]);

  const photosByYear = useMemo(() => {
    return timelinePhotos.reduce((acc, photo) => {
      const date = photo.takenAt || photo.date;
      const year = date ? new Date(date).getFullYear() : '未标记年份';
      if (!acc[year]) acc[year] = [];
      acc[year].push(photo);
      return acc;
    }, {});
  }, [timelinePhotos]);

  const filteredAlbums = useMemo(() => {
    const albumMap = {};
    filteredPhotos.forEach(p => {
      const albumName = p.album || '未分类';
      if (!albumMap[albumName]) albumMap[albumName] = [];
      albumMap[albumName].push(p);
    });
    return albumMap;
  }, [filteredPhotos]);

  const getCollectionForPhoto = useCallback((photo) => {
    if (view === 'album') {
      const albumName = photo.album || '未分类';
      return filteredAlbums[albumName] || [];
    }
    if (view === 'timeline') {
      return timelinePhotos;
    }
    return orderedPhotos;
  }, [view, filteredAlbums, timelinePhotos, orderedPhotos]);

  const openLightbox = useCallback((photo) => {
    const collection = getCollectionForPhoto(photo);
    const index = collection.findIndex((p) => p.id === photo.id);
    if (index === -1) return;
    setLightboxState({ photos: collection, index });
  }, [getCollectionForPhoto]);

  const handleNext = useCallback(() => {
    setLightboxState((state) => {
      if (!state) return state;
      if (state.index >= state.photos.length - 1) return state;
      return { ...state, index: state.index + 1 };
    });
  }, []);

  const handlePrev = useCallback(() => {
    setLightboxState((state) => {
      if (!state) return state;
      if (state.index <= 0) return state;
      return { ...state, index: state.index - 1 };
    });
  }, []);

  const handleClose = useCallback(() => {
    setLightboxState(null);
  }, []);

  const handleGoToIndex = useCallback((index) => {
    setLightboxState((state) => {
      if (!state) return state;
      if (index >= 0 && index < state.photos.length) {
        return { ...state, index };
      }
      return state;
    });
  }, []);

  const handleImageLoad = useCallback((photoId) => {
    setImageLoadStates(prev => ({ ...prev, [photoId]: true }));
  }, []);

  const handleImageError = useCallback((photoId) => {
    setImageLoadStates(prev => ({ ...prev, [photoId]: 'error' }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedAlbum('');
    setSelectedYear('');
  }, []);

  const hasActiveFilters = searchQuery || selectedAlbum || selectedYear;

  const renderContent = () => {
    if (filteredPhotos.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="inline-block p-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-6">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">未找到照片</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {hasActiveFilters
              ? '没有符合当前筛选条件的照片，请尝试调整搜索条件或筛选器'
              : '暂时没有照片，请稍后再来查看'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent-dark transition-all hover:shadow-lg font-medium"
            >
              清除所有筛选条件
            </button>
          )}
        </motion.div>
      );
    }

    switch (view) {
      case 'album':
        return Object.entries(filteredAlbums).map(([albumName, albumPhotos]) => (
          <motion.div
            key={albumName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-serif mb-6 pl-3 border-l-4 border-accent flex items-center gap-2">
              <Folder className="w-5 h-5 text-accent" />
              {albumName}
              <span className="text-base font-normal text-gray-500 ml-2">({albumPhotos.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {albumPhotos.map((photo, index) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onPhotoClick={openLightbox}
                  onImageLoad={handleImageLoad}
                  onImageError={handleImageError}
                  loadState={imageLoadStates[photo.id]}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        ));
      case 'timeline':
        const sortedYears = Object.entries(photosByYear).sort((a, b) => {
          const parseYear = (value) => (value === '未标记年份' ? -Infinity : Number(value));
          return parseYear(b[0]) - parseYear(a[0]);
        });
        return sortedYears.map(([year, yearPhotos]) => (
          <motion.div
            key={year}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center flex items-center justify-center gap-3">
              <Calendar className="w-6 h-6 text-accent" />
              {year}
              <span className="text-xl font-normal text-gray-500">({yearPhotos.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {yearPhotos.sort((a, b) => new Date(b.takenAt || b.date) - new Date(a.takenAt || a.date)).map((photo, index) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onPhotoClick={openLightbox}
                  onImageLoad={handleImageLoad}
                  onImageError={handleImageError}
                  loadState={imageLoadStates[photo.id]}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        ));
      case 'grid':
      default:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {orderedPhotos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onPhotoClick={openLightbox}
                onImageLoad={handleImageLoad}
                onImageError={handleImageError}
                loadState={imageLoadStates[photo.id]}
                index={index}
              />
            ))}
          </div>
        );
    }
  };

  const activePhoto = lightboxState ? lightboxState.photos[lightboxState.index] : null;

  return (
    <div className="space-y-6">
      {/* 搜索和筛选栏 */}
      <div className="space-y-4">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索照片标题、相机、镜头..."
            className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all bg-white/80 backdrop-blur-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* 筛选器 */}
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={selectedAlbum}
            onChange={(e) => setSelectedAlbum(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
          >
            <option value="">所有相册</option>
            {Object.keys(albums).sort().map(album => (
              <option key={album} value={album}>{album} ({albums[album].length})</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
          >
            <option value="">所有年份</option>
            {years.map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              清除筛选
            </button>
          )}
          <div className="ml-auto text-sm text-gray-600">
            找到 <span className="font-semibold text-accent">{filteredPhotos.length}</span> 张照片
          </div>
        </div>
      </div>

      {/* 视图切换器 */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-full p-1.5 flex items-center gap-1 shadow-sm">
          <button
            onClick={() => { setView('grid'); setLightboxState(null); }}
            className={`px-4 md:px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              view === 'grid'
                ? 'bg-white text-primary shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>网格</span>
          </button>
          <button
            onClick={() => { setView('album'); setLightboxState(null); }}
            className={`px-4 md:px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              view === 'album'
                ? 'bg-white text-primary shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4" />
            <span>相册</span>
          </button>
          <button
            onClick={() => { setView('timeline'); setLightboxState(null); }}
            className={`px-4 md:px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              view === 'timeline'
                ? 'bg-white text-primary shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>时间轴</span>
          </button>
        </div>
      </div>

      {/* 内容 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view + searchQuery + selectedAlbum + selectedYear}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Lightbox 组件 */}
      {activePhoto && (
        <Lightbox
          activePhoto={activePhoto}
          photos={lightboxState.photos}
          onClose={handleClose}
          onNext={handleNext}
          onPrev={handlePrev}
          onGoToIndex={handleGoToIndex}
        />
      )}
    </div>
  );
};

const PhotoCard = ({ photo, onPhotoClick, onImageLoad, onImageError, loadState, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    // 使用 Intersection Observer 实现真正的懒加载
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 图片加载状态由 img 标签的 onLoad/onError 处理

  return (
    <motion.div
      ref={cardRef}
      className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl cursor-pointer bg-white"
      onClick={() => onPhotoClick(photo)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
      whileHover={{ y: -8 }}
    >
      {/* 图片容器 */}
      <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
        {loadState === 'error' ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
            <Camera className="w-12 h-12" />
          </div>
        ) : (
          <>
            {(!shouldLoad || !loadState) && loadState !== 'error' && (
              <div className="absolute inset-0 image-loading" />
            )}
            {shouldLoad && (
              <motion.img
                src={photo.src}
                alt={photo.title}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  loadState ? 'opacity-100' : 'opacity-0'
                }`}
                animate={{
                  scale: isHovered ? 1.1 : 1,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                onLoad={() => onImageLoad(photo.id)}
                onError={() => onImageError(photo.id)}
                loading="lazy"
              />
            )}
          </>
        )}
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* 信息覆盖层 */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="font-serif text-lg font-semibold mb-1 line-clamp-1">{photo.title}</h3>
        <div className="flex items-center text-xs opacity-90 gap-2 flex-wrap">
          {photo.camera && (
            <div className="flex items-center gap-1">
              <Camera size={12} />
              <span className="line-clamp-1">{photo.camera}</span>
            </div>
          )}
          {photo.date && (
            <span className="text-xs opacity-75">
              {new Date(photo.takenAt || photo.date).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          )}
        </div>
      </div>

      {/* 底部固定信息（仅显示相册） */}
      <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-0 transition-opacity">
        <span className="text-xs text-white/90 bg-black/30 backdrop-blur-sm px-2 py-1 rounded">
          {photo.album || '未分类'}
        </span>
      </div>
    </motion.div>
  );
};

export default PhotoGrid;