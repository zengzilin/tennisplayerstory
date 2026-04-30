
import React from 'react';

const ImageWithAlt = ({ src, alt, title, className, ...props }) => {
  if (!alt && alt !== "") {
    console.warn(`ImageWithAlt: Missing alt text for image ${src}`);
  }

  return (
    <img
      src={src}
      alt={alt || "TennisHub decorative image"}
      title={title || alt}
      loading="lazy"
      decoding="async"
      className={className}
      {...props}
    />
  );
};

export default ImageWithAlt;
