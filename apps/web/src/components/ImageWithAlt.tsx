import React from 'react';

interface ImageWithAltProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  className?: string;
}

const ImageWithAlt: React.FC<ImageWithAltProps> = ({ src, alt, className, ...props }) => {
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
