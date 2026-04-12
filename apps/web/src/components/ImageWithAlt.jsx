
import React from 'react';

const ImageWithAlt = ({ src, alt, className, ...props }) => {
  if (!alt && alt !== "") {
    console.warn(`ImageWithAlt: Missing alt text for image ${src}`);
  }

  return (
    <img
      src={src}
      alt={alt || "TennisHub Image"}
      loading="lazy"
      className={className}
      {...props}
    />
  );
};

export default ImageWithAlt;
