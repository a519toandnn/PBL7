import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminCustomersScreen from './AdminCustomersScreen';
import useAuth from '../hooks/useAuth';

jest.mock('../hooks/useAuth');
jest.mock('sweetalert', () => jest.fn());

describe('AdminCustomersScreen admin protections', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: { id: 10, role: 'ADMIN' } });
    localStorage.setItem('token', 'test-token');
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              data: [
                { id: 1, full_name: 'Root Admin', email: 'root@example.com', role: 'ADMIN', status: 'ACTIVE' },
                { id: 2, full_name: 'Regular Customer', email: 'customer@example.com', role: 'CUSTOMER', status: 'LOCKED' },
              ],
            },
          }),
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('prevents admins from changing another admin role or status', async () => {
    render(<AdminCustomersScreen />);

    const adminRoleSelect = await screen.findByDisplayValue('ADMIN');
    const adminStatusSelect = screen.getByDisplayValue('ACTIVE');
    const customerRoleSelect = screen.getByDisplayValue('CUSTOMER');
    const customerStatusSelect = screen.getByDisplayValue('LOCKED');

    expect(adminRoleSelect.disabled).toBe(true);
    expect(adminStatusSelect.disabled).toBe(true);
    expect(customerRoleSelect.disabled).toBe(false);
    expect(customerStatusSelect.disabled).toBe(false);

    fireEvent.change(adminRoleSelect, { target: { value: 'CUSTOMER' } });
    fireEvent.change(adminStatusSelect, { target: { value: 'LOCKED' } });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });
});
