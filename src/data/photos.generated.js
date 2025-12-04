// 本文件由 scripts/generate-photos.mjs 自动生成，请勿手改
// 规则：扫描 public/photos 下的图片；子目录名作为相册 (album)；文件名转为标题
const rawBase = import.meta.env.BASE_URL || '/';
const base = rawBase.endsWith('/') ? rawBase : rawBase + '/';
const photos = [
  {
    id: '小动物们-狗',
    src: base + 'photos/小动物们/狗🐶.jpg',
    title: '狗🐶',
    album: '小动物们',
    date: '2025-11',
    takenAt: '2025-11-01T12:41:23.000Z',
    camera: 'SONY ILCE-7M4',
    lens: '24-70mm F2.8 DG DN II | Art 024',
    focalLength: 70,
    aperture: 2.8,
    iso: 800,
    shutter: '1/13s'
  },
  {
    id: '徐志摩故居-眉轩徐志摩书房',
    src: base + 'photos/徐志摩故居/“眉轩”徐志摩书房.jpg',
    title: '“眉轩”徐志摩书房',
    album: '徐志摩故居',
    date: '2024-10',
    takenAt: '2024-10-01T07:07:34.000Z',
    camera: 'SONY ILCE-6300',
    lens: 'E 18-135mm F3.5-5.6 OSS',
    focalLength: 18,
    aperture: 3.5,
    iso: 5000,
    shutter: '1/160s'
  },
  {
    id: '徐志摩故居-墙上的画',
    src: base + 'photos/徐志摩故居/墙上的画.jpg',
    title: '墙上的画',
    album: '徐志摩故居',
    date: '2024-10',
    takenAt: '2024-10-01T06:54:53.000Z',
    camera: 'SONY ILCE-6300',
    lens: 'E 18-135mm F3.5-5.6 OSS',
    focalLength: 66,
    aperture: 5.6,
    iso: 250,
    shutter: '1/160s'
  },
  {
    id: '徐志摩故居-安雅堂',
    src: base + 'photos/徐志摩故居/安雅堂.jpg',
    title: '安雅堂',
    album: '徐志摩故居',
    date: '2024-10',
    takenAt: '2024-10-01T06:59:39.000Z',
    camera: 'SONY ILCE-6300',
    lens: 'E 18-135mm F3.5-5.6 OSS',
    focalLength: 18,
    aperture: 4,
    iso: 6400,
    shutter: '1/60s'
  },
  {
    id: '徐志摩故居-裕丰酱园',
    src: base + 'photos/徐志摩故居/裕丰酱园.jpg',
    title: '裕丰酱园',
    album: '徐志摩故居',
    date: '2024-10',
    takenAt: '2024-10-01T06:54:40.000Z',
    camera: 'SONY ILCE-6300',
    lens: 'E 18-135mm F3.5-5.6 OSS',
    focalLength: 66,
    aperture: 5.6,
    iso: 320,
    shutter: '1/125s'
  },
  {
    id: '徐志摩故居-诗人徐志摩故居',
    src: base + 'photos/徐志摩故居/诗人徐志摩故居.jpg',
    title: '诗人徐志摩故居',
    album: '徐志摩故居',
    date: '2024-10',
    takenAt: '2024-10-01T06:56:12.000Z',
    camera: 'SONY ILCE-6300',
    lens: 'E 18-135mm F3.5-5.6 OSS',
    focalLength: 53,
    aperture: 5,
    iso: 500,
    shutter: '1/160s'
  }
]

export default photos
