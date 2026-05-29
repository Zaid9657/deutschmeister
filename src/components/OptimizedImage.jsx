function toWebpSrc(src) {
  return src.replace(/\.(png|jpe?g)$/i, '.webp');
}

export default function OptimizedImage({ src, alt, className, width, height, loading = 'lazy', ...rest }) {
  const webpSrc = toWebpSrc(src);
  const isConvertible = webpSrc !== src;

  return (
    <picture>
      {isConvertible && <source srcSet={webpSrc} type="image/webp" />}
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        {...rest}
      />
    </picture>
  );
}
