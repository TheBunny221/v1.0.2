import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ComplaintQuickActions from '../ComplaintQuickActions';

describe('ComplaintQuickActions', () => {
  const complaint = {
    id: '123',
    complaintId: 'KSC0002',
    status: 'REGISTERED',
    priority: 'MEDIUM',
    type: 'Roads',
    description: 'A pothole',
    area: 'Kochi',
  };

  it('should render the correct link for MAINTENANCE_TEAM role', () => {
    render(
      <MemoryRouter>
        <ComplaintQuickActions complaint={complaint} userRole="MAINTENANCE_TEAM" />
      </MemoryRouter>
    );

    const link = screen.getAllByRole('link')[0];
    expect(link).toHaveAttribute('href', '/tasks/123');
  });

  it('should render the correct link for CITIZEN role', () => {
    render(
      <MemoryRouter>
        <ComplaintQuickActions complaint={complaint} userRole="CITIZEN" />
      </MemoryRouter>
    );

    const link = screen.getAllByRole('link')[0];
    expect(link).toHaveAttribute('href', '/complaints/123');
  });

  it('should render the correct link for WARD_OFFICER role', () => {
    render(
      <MemoryRouter>
        <ComplaintQuickActions complaint={complaint} userRole="WARD_OFFICER" />
      </MemoryRouter>
    );

    const link = screen.getAllByRole('link')[0];
    expect(link).toHaveAttribute('href', '/complaints/123');
  });
});
