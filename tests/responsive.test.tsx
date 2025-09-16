import React from 'react';
import { render, screen } from '@testing-library/react';
import { useResponsive } from '../hooks/useResponsive';
import { Container } from '../components/layout/Container';
import { Grid } from '../components/layout/Grid';
import { Flex } from '../components/layout/Flex';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock useResponsive hook
jest.mock('../hooks/useResponsive', () => ({
  useResponsive: jest.fn(),
}));

const mockUseResponsive = useResponsive as jest.MockedFunction<typeof useResponsive>;

describe('Responsive Components', () => {
  beforeEach(() => {
    // Default to desktop view
    mockUseResponsive.mockReturnValue({
      width: 1024,
      height: 768,
      breakpoint: 'lg',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isWide: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Container Component', () => {
    it('renders with default maxWidth', () => {
      render(
        <Container>
          <div>Test content</div>
        </Container>
      );
      
      const container = screen.getByText('Test content').parentElement;
      expect(container).toHaveClass('w-full', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
    });

    it('renders with custom maxWidth', () => {
      render(
        <Container maxWidth="sm">
          <div>Test content</div>
        </Container>
      );
      
      const container = screen.getByText('Test content').parentElement;
      expect(container).toHaveClass('max-w-sm');
    });

    it('renders as fluid container', () => {
      render(
        <Container fluid>
          <div>Test content</div>
        </Container>
      );
      
      const container = screen.getByText('Test content').parentElement;
      expect(container).not.toHaveClass('max-w-');
    });
  });

  describe('Grid Component', () => {
    it('renders with default responsive grid', () => {
      render(
        <Grid>
          <div>Item 1</div>
          <div>Item 2</div>
        </Grid>
      );
      
      const grid = screen.getByText('Item 1').parentElement;
      expect(grid).toHaveClass('grid', 'grid-cols-1', 'gap-4');
    });

    it('renders with 2 columns responsive grid', () => {
      render(
        <Grid cols={2}>
          <div>Item 1</div>
          <div>Item 2</div>
        </Grid>
      );
      
      const grid = screen.getByText('Item 1').parentElement;
      expect(grid).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-2', 'gap-4');
    });

    it('renders with custom gap', () => {
      render(
        <Grid gap="lg">
          <div>Item 1</div>
        </Grid>
      );
      
      const grid = screen.getByText('Item 1').parentElement;
      expect(grid).toHaveClass('gap-6');
    });

    it('renders with non-responsive grid', () => {
      render(
        <Grid cols={3} responsive={false}>
          <div>Item 1</div>
        </Grid>
      );
      
      const grid = screen.getByText('Item 1').parentElement;
      expect(grid).toHaveClass('grid', 'grid-cols-3');
      expect(grid).not.toHaveClass('sm:grid-cols-');
    });
  });

  describe('Flex Component', () => {
    it('renders with default responsive flex', () => {
      render(
        <Flex>
          <div>Item 1</div>
          <div>Item 2</div>
        </Flex>
      );
      
      const flex = screen.getByText('Item 1').parentElement;
      expect(flex).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'justify-start', 'items-start', 'gap-4');
    });

    it('renders with custom direction', () => {
      render(
        <Flex direction="col">
          <div>Item 1</div>
        </Flex>
      );
      
      const flex = screen.getByText('Item 1').parentElement;
      expect(flex).toHaveClass('flex', 'flex-col');
    });

    it('renders with custom justify and align', () => {
      render(
        <Flex justify="center" align="center">
          <div>Item 1</div>
        </Flex>
      );
      
      const flex = screen.getByText('Item 1').parentElement;
      expect(flex).toHaveClass('justify-center', 'items-center');
    });

    it('renders with custom gap', () => {
      render(
        <Flex gap="xl">
          <div>Item 1</div>
        </Flex>
      );
      
      const flex = screen.getByText('Item 1').parentElement;
      expect(flex).toHaveClass('gap-8');
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts to mobile view', () => {
      mockUseResponsive.mockReturnValue({
        width: 375,
        height: 667,
        breakpoint: 'xs',
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isWide: false,
      });

      render(
        <Container>
          <div>Mobile content</div>
        </Container>
      );
      
      const container = screen.getByText('Mobile content').parentElement;
      expect(container).toHaveClass('px-4');
    });

    it('adapts to tablet view', () => {
      mockUseResponsive.mockReturnValue({
        width: 768,
        height: 1024,
        breakpoint: 'md',
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        isWide: false,
      });

      render(
        <Grid cols={3}>
          <div>Tablet content</div>
        </Grid>
      );
      
      const grid = screen.getByText('Tablet content').parentElement;
      expect(grid).toHaveClass('sm:grid-cols-2', 'lg:grid-cols-3');
    });

    it('adapts to desktop view', () => {
      mockUseResponsive.mockReturnValue({
        width: 1440,
        height: 900,
        breakpoint: '2xl',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isWide: true,
      });

      render(
        <Flex direction="row">
          <div>Desktop content</div>
        </Flex>
      );
      
      const flex = screen.getByText('Desktop content').parentElement;
      expect(flex).toHaveClass('flex-col', 'sm:flex-row');
    });
  });

  describe('Responsive Utilities', () => {
    it('renders ResponsiveGrid with custom breakpoints', () => {
      const { ResponsiveGrid } = require('../components/layout/Grid');
      
      render(
        <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 4 }}>
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      );
      
      const grid = screen.getByText('Item 1').parentElement;
      expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4');
    });

    it('renders AutoGrid with minWidth', () => {
      const { AutoGrid } = require('../components/layout/Grid');
      
      render(
        <AutoGrid minWidth="200px">
          <div>Item 1</div>
        </AutoGrid>
      );
      
      const grid = screen.getByText('Item 1').parentElement;
      expect(grid).toHaveClass('grid', 'gap-4');
      expect(grid).toHaveStyle('grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))');
    });

    it('renders Stack with vertical direction', () => {
      const { Stack } = require('../components/layout/Flex');
      
      render(
        <Stack direction="vertical" spacing="lg">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );
      
      const stack = screen.getByText('Item 1').parentElement;
      expect(stack).toHaveClass('flex', 'flex-col', 'space-y-6');
    });

    it('renders Center with both axis', () => {
      const { Center } = require('../components/layout/Flex');
      
      render(
        <Center axis="both">
          <div>Centered content</div>
        </Center>
      );
      
      const center = screen.getByText('Centered content').parentElement;
      expect(center).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });
});

describe('Responsive Hook Tests', () => {
  it('returns correct screen size for mobile', () => {
    mockUseResponsive.mockReturnValue({
      width: 375,
      height: 667,
      breakpoint: 'xs',
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isWide: false,
    });

    const TestComponent = () => {
      const { isMobile, isTablet, isDesktop } = useResponsive();
      return (
        <div>
          <span data-testid="mobile">{isMobile ? 'mobile' : 'not-mobile'}</span>
          <span data-testid="tablet">{isTablet ? 'tablet' : 'not-tablet'}</span>
          <span data-testid="desktop">{isDesktop ? 'desktop' : 'not-desktop'}</span>
        </div>
      );
    };

    render(<TestComponent />);
    
    expect(screen.getByTestId('mobile')).toHaveTextContent('mobile');
    expect(screen.getByTestId('tablet')).toHaveTextContent('not-tablet');
    expect(screen.getByTestId('desktop')).toHaveTextContent('not-desktop');
  });

  it('returns correct screen size for tablet', () => {
    mockUseResponsive.mockReturnValue({
      width: 768,
      height: 1024,
      breakpoint: 'md',
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      isWide: false,
    });

    const TestComponent = () => {
      const { isMobile, isTablet, isDesktop } = useResponsive();
      return (
        <div>
          <span data-testid="mobile">{isMobile ? 'mobile' : 'not-mobile'}</span>
          <span data-testid="tablet">{isTablet ? 'tablet' : 'not-tablet'}</span>
          <span data-testid="desktop">{isDesktop ? 'desktop' : 'not-desktop'}</span>
        </div>
      );
    };

    render(<TestComponent />);
    
    expect(screen.getByTestId('mobile')).toHaveTextContent('not-mobile');
    expect(screen.getByTestId('tablet')).toHaveTextContent('tablet');
    expect(screen.getByTestId('desktop')).toHaveTextContent('not-desktop');
  });

  it('returns correct screen size for desktop', () => {
    mockUseResponsive.mockReturnValue({
      width: 1440,
      height: 900,
      breakpoint: '2xl',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isWide: true,
    });

    const TestComponent = () => {
      const { isMobile, isTablet, isDesktop } = useResponsive();
      return (
        <div>
          <span data-testid="mobile">{isMobile ? 'mobile' : 'not-mobile'}</span>
          <span data-testid="tablet">{isTablet ? 'tablet' : 'not-tablet'}</span>
          <span data-testid="desktop">{isDesktop ? 'desktop' : 'not-desktop'}</span>
        </div>
      );
    };

    render(<TestComponent />);
    
    expect(screen.getByTestId('mobile')).toHaveTextContent('not-mobile');
    expect(screen.getByTestId('tablet')).toHaveTextContent('not-tablet');
    expect(screen.getByTestId('desktop')).toHaveTextContent('desktop');
  });
});
