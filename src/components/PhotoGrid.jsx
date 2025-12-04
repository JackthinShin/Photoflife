import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, Image as ImageIcon, List, SlidersHorizontal } from 'lucide-react';
import photos from '../data/photos';
import Lightbox from './Lightbox';

const PhotoGrid = () => {
  const [view, setView] = useState('grid'); // grid, album, timeline
  const [lightboxState, setLightboxState] = useState(null); // { photos: Photo[], index: number }

  const orderedPhotos = useMemo(() => {
    return [...photos];
  }, [photos]);

  const timelinePhotos = useMemo(() => {
    return [...photos].sort((a, b) => {
      const aDate = a.takenAt || a.date || '';
      const bDate = b.takenAt || b.date || '';
      return new Date(bDate) - new Date(aDate);
    });
  }, [photos]);

  const photosByYear = useMemo(() => {
    return timelinePhotos.reduce((acc, photo) => {
      const date = photo.takenAt || photo.date;
      const year = date ? new Date(date).getFullYear() : '未标记年份';
      if (!acc[year]) acc[year] = [];
      acc[year].push(photo);
      return acc;
    }, {});
  }, [timelinePhotos]);

  const albums = useMemo(() => {
    return photos.reduce((acc, p) => {
      const albumName = p.album || '未分类';
      if (!acc[albumName]) acc[albumName] = [];
      acc[albumName].push(p);
      return acc;
    }, {});
  }, [photos]);

  const getCollectionForPhoto = useCallback((photo) => {
    if (view === 'album') {
      const albumName = photo.album || '未分类';
      return albums[albumName] || [];
    }
    if (view === 'timeline') {
      return timelinePhotos;
    }
    return orderedPhotos;
  }, [view, albums, timelinePhotos, orderedPhotos]);

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

  const renderContent = () => {
    switch (view) {
        case 'album':
          return Object.entries(albums).map(([albumName, albumPhotos]) => (
            <div key={albumName} className="mb-12">
              <h2 className="text-2xl font-serif mb-6 pl-2 border-l-4 border-primary">{albumName}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {albumPhotos.map(photo => (
                  <PhotoCard key={photo.id} photo={photo} onPhotoClick={openLightbox} />
                ))}
              </div>
            </div>
          ));
        case 'timeline':
          const sortedYears = Object.entries(photosByYear).sort((a, b) => {
            const parseYear = (value) => (value === '未标记年份' ? -Infinity : Number(value));
            return parseYear(b[0]) - parseYear(a[0]);
          });
          return sortedYears.map(([year, yearPhotos]) => (
            <div key={year} className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-center">{year}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {yearPhotos.sort((a, b) => new Date(b.takenAt || b.date) - new Date(a.takenAt || a.date)).map(photo => (
                  <PhotoCard key={photo.id} photo={photo} onPhotoClick={openLightbox} />
                ))}
              </div>
            </div>
          ));
        case 'grid':
        default:
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {orderedPhotos.map(photo => (
                <PhotoCard key={photo.id} photo={photo} onPhotoClick={openLightbox} />
              ))}
            </div>
          );
      }
  };

  const activePhoto = lightboxState ? lightboxState.photos[lightboxState.index] : null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 视图切换器 */}
      <div className="flex justify-center mb-8">
        <div className="bg-secondary rounded-full p-1 flex items-center gap-1">
          <button onClick={() => { setView('grid'); setLightboxState(null); }} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${view === 'grid' ? 'bg-white text-primary' : 'text-secondary-foreground'}`}><ImageIcon className="w-5 h-5 inline-block mr-1" /> 网格</button>
          <button onClick={() => { setView('album'); setLightboxState(null); }} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${view === 'album' ? 'bg-white text-primary' : 'text-secondary-foreground'}`}><List className="w-5 h-5 inline-block mr-1" /> 相册</button>
          <button onClick={() => { setView('timeline'); setLightboxState(null); }} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${view === 'timeline' ? 'bg-white text-primary' : 'text-secondary-foreground'}`}><SlidersHorizontal className="w-5 h-5 inline-block mr-1" /> 时间轴</button>
        </div>
      </div>
      
      {/* 内容 */}
      {renderContent()}

      {/* Lightbox 组件 */}
      {activePhoto && (
        <Lightbox 
          activePhoto={activePhoto}
          photos={lightboxState.photos}
          onClose={handleClose}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      )}
    </div>
  );
};

const PhotoCard = ({ photo, onPhotoClick }) => {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer"
      onClick={() => onPhotoClick(photo)}
      layoutId={`photo-${photo.id}`}
      whileHover={{ y: -5 }}
    >
      <img src={photo.src} alt={photo.title} className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-0 left-0 p-4 text-white">
        <h3 className="font-serif text-lg">{photo.title}</h3>
        <div className="flex items-center text-xs mt-1 opacity-80">
          <Camera size={14} className="mr-1.5" />
          <span>{photo.camera || 'Unknown'}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PhotoGrid;
