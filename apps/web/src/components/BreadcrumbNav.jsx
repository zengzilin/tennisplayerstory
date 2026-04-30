
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const BreadcrumbNav = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6 overflow-x-auto whitespace-nowrap pb-2">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.path} className="flex items-center">
              {index === 0 ? (
                <Link 
                  to={item.path} 
                  className="flex items-center hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  aria-label="Home"
                >
                  <Home className="h-4 w-4" />
                </Link>
              ) : (
                <Link 
                  to={item.path} 
                  className={`hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded ${isLast ? 'font-medium text-foreground pointer-events-none' : ''}`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              )}
              {!isLast && <ChevronRight className="h-4 w-4 mx-1 opacity-50 shrink-0" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default BreadcrumbNav;
