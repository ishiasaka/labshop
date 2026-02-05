import React from 'react';
import { render, screen } from '@testing-library/react';
import StudentCarousel from '../StudentCarousel';
import '@testing-library/jest-dom';

describe('StudentCarousel', () => {
  it('renders without crashing', () => {
    render(<StudentCarousel />);
    const carouselElements = screen.getAllByText(/Owed Amount/i);
    expect(carouselElements.length).toBeGreaterThan(0);
  });

  it('displays student names', () => {
    render(<StudentCarousel />);
    expect(screen.getAllByText('Alice Johnson')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Bob Smith')[0]).toBeInTheDocument();
  });

  it('displays owed amounts formatted correctly', () => {
    render(<StudentCarousel />);
    expect(screen.getAllByText('$50.00')[0]).toBeInTheDocument();
    expect(screen.getAllByText('$120.50')[0]).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(<StudentCarousel />);
    expect(container).toMatchSnapshot();
  });
});
