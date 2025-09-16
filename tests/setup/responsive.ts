import { configure } from '@testing-library/react';

// Configure testing library for responsive testing
configure({
  testIdAttribute: 'data-testid',
});

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (matches: boolean = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: matches,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.innerWidth and innerHeight
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});

// Mock window.getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

// Mock document.body.style
Object.defineProperty(document.body, 'style', {
  value: {
    overflow: '',
  },
  writable: true,
});

// Responsive test utilities
export const responsiveTestUtils = {
  // Set viewport size for testing
  setViewport: (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
  },

  // Mock mobile viewport
  setMobileViewport: () => {
    responsiveTestUtils.setViewport(375, 667);
    mockMatchMedia(false); // No media queries match on mobile
  },

  // Mock tablet viewport
  setTabletViewport: () => {
    responsiveTestUtils.setViewport(768, 1024);
    mockMatchMedia(true); // Some media queries match on tablet
  },

  // Mock desktop viewport
  setDesktopViewport: () => {
    responsiveTestUtils.setViewport(1440, 900);
    mockMatchMedia(true); // Most media queries match on desktop
  },

  // Mock wide viewport
  setWideViewport: () => {
    responsiveTestUtils.setViewport(1920, 1080);
    mockMatchMedia(true); // All media queries match on wide
  },

  // Test responsive breakpoints
  testBreakpoints: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1440, height: 900 },
    wide: { width: 1920, height: 1080 },
  },

  // Mock media query matches
  mockMediaQuery: (query: string, matches: boolean) => {
    const mediaQueryList = {
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((q) => {
        if (q === query) {
          return mediaQueryList;
        }
        return {
          matches: false,
          media: q,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      }),
    });

    return mediaQueryList;
  },

  // Test responsive classes
  testResponsiveClasses: {
    // Container classes
    container: {
      mobile: 'w-full mx-auto px-4',
      tablet: 'w-full mx-auto px-4 sm:px-6',
      desktop: 'w-full mx-auto px-4 sm:px-6 lg:px-8',
    },
    
    // Grid classes
    grid: {
      mobile: 'grid grid-cols-1 gap-4',
      tablet: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
      desktop: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
    },
    
    // Flex classes
    flex: {
      mobile: 'flex flex-col justify-start items-start gap-4',
      tablet: 'flex flex-col sm:flex-row justify-start items-start gap-4',
      desktop: 'flex flex-col sm:flex-row justify-start items-start gap-4',
    },
    
    // Text classes
    text: {
      mobile: 'text-sm',
      tablet: 'text-sm sm:text-base',
      desktop: 'text-sm sm:text-base lg:text-lg',
    },
    
    // Spacing classes
    spacing: {
      mobile: 'p-4',
      tablet: 'p-4 sm:p-6',
      desktop: 'p-4 sm:p-6 lg:p-8',
    },
  },

  // Test responsive behavior
  testResponsiveBehavior: {
    // Test if element has correct classes for viewport
    hasResponsiveClasses: (element: HTMLElement, viewport: 'mobile' | 'tablet' | 'desktop') => {
      const classes = responsiveTestUtils.testResponsiveClasses;
      const expectedClasses = classes.container[viewport].split(' ');
      
      return expectedClasses.every(cls => element.classList.contains(cls));
    },

    // Test if element is visible on viewport
    isVisibleOnViewport: (element: HTMLElement, viewport: 'mobile' | 'tablet' | 'desktop') => {
      const computedStyle = window.getComputedStyle(element);
      const display = computedStyle.display;
      const visibility = computedStyle.visibility;
      
      if (viewport === 'mobile') {
        return !element.classList.contains('hidden') && 
               !element.classList.contains('sm:block') &&
               !element.classList.contains('lg:block');
      }
      
      if (viewport === 'tablet') {
        return !element.classList.contains('hidden') && 
               !element.classList.contains('lg:block');
      }
      
      if (viewport === 'desktop') {
        return !element.classList.contains('hidden');
      }
      
      return display !== 'none' && visibility !== 'hidden';
    },

    // Test if element has correct responsive text size
    hasResponsiveTextSize: (element: HTMLElement, viewport: 'mobile' | 'tablet' | 'desktop') => {
      const textClasses = responsiveTestUtils.testResponsiveClasses.text[viewport].split(' ');
      return textClasses.some(cls => element.classList.contains(cls));
    },
  },
};

// Export default setup
export default responsiveTestUtils;
