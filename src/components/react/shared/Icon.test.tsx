import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icon } from './Icon';

describe('Icon Component', () => {
    it('should render an icon by name', () => {
        render(<Icon name="Rocket" />);
        // All my icons should have a data-testid for easier testing or are SVG elements
        const icon = screen.getByTestId('icon-Rocket');
        expect(icon).toBeInTheDocument();
        expect(icon.tagName.toLowerCase()).toBe('svg');
    });

    it('should apply custom className', () => {
        render(<Icon name="Rocket" className="custom-class" />);
        const icon = screen.getByTestId('icon-Rocket');
        expect(icon).toHaveClass('custom-class');
    });

    it('should apply custom size', () => {
        render(<Icon name="Rocket" size={32} />);
        const icon = screen.getByTestId('icon-Rocket');
        expect(icon).toHaveAttribute('width', '32');
        expect(icon).toHaveAttribute('height', '32');
    });

    it('should apply custom stroke color', () => {
        render(<Icon name="Rocket" color="red" />);
        const icon = screen.getByTestId('icon-Rocket');
        expect(icon).toHaveAttribute('stroke', 'red');
    });

    it('should render nothing if name is invalid', () => {
        const { container } = render(<Icon name="InvalidIcon" as any />);
        expect(container.firstChild).toBeNull();
    });
});
