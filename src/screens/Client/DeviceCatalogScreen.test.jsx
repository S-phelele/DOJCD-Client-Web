import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });

const mockToast = { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() };
jest.mock('../../components/ToastProvider', () => ({ useToast: () => mockToast }));
jest.mock('../../components/ConfirmDialog', () => () => null);

const mockApi = { checkEligibility: jest.fn(), getAvailableDevices: jest.fn(), getCategories: jest.fn(), submitApplication: jest.fn() };
jest.mock('../../services/api', () => ({ deviceAPI: { ...mockApi } }));

const DeviceCatalogScreen = require('./DeviceCatalogScreen').default;

const phone  = { device_id: 1, device_name: 'Galaxy A15', model: 'A155', manufacturer: 'Samsung', plan_name: 'Smart 5GB', monthly_cost: 299, contract_duration_months: 24, category_id: 1, category_name: 'Mobile Phones' };
const laptop = { device_id: 2, device_name: 'Latitude 5440', model: '5440', manufacturer: 'Dell', plan_name: 'Business 24', monthly_cost: 650, contract_duration_months: 24, category_id: 3, category_name: 'Laptops & Computers' };
const data   = { device_id: 3, device_name: '20GB Bundle', model: null, manufacturer: null, plan_name: 'Monthly 20GB', monthly_cost: 199, contract_duration_months: 12, category_id: 5, category_name: 'Data & Connectivity' };
const categories = [{ category_id: 1 }, { category_id: 3 }, { category_id: 5 }];

beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('user', JSON.stringify({ client_user_id: 7 }));
    mockApi.checkEligibility.mockResolvedValue({ data: { data: { eligibility: { eligible: true } } } });
    mockApi.getAvailableDevices.mockResolvedValue({ data: { data: { devices: [phone, laptop, data] } } });
    mockApi.getCategories.mockResolvedValue({ data: { data: { categories } } });
});

describe('DeviceCatalogScreen categories', () => {
    it('shows a chip per category with counts and filters the items', async () => {
        render(<DeviceCatalogScreen />);
        const tabs = await screen.findByRole('tablist', { name: /categories/i });
        expect(within(tabs).getAllByRole('tab').map((t) => t.textContent)).toEqual(['All 3', 'Mobile Phones 1', 'Laptops & Computers 1', 'Data & Connectivity 1']);
        expect(screen.getByText('Galaxy A15')).toBeInTheDocument();
        expect(screen.getByText('Latitude 5440')).toBeInTheDocument();

        fireEvent.click(within(tabs).getByRole('tab', { name: /laptops/i }));
        expect(screen.queryByText('Galaxy A15')).not.toBeInTheDocument();
        expect(screen.getByText('Latitude 5440')).toBeInTheDocument();
        expect(screen.getByText('1 item available')).toBeInTheDocument();

        fireEvent.click(within(tabs).getByRole('tab', { name: /^all/i }));
        expect(screen.getByText('Galaxy A15')).toBeInTheDocument();
    });

    it('search also matches the category, and combines with the chosen category', async () => {
        render(<DeviceCatalogScreen />);
        await screen.findByRole('tablist');
        fireEvent.change(screen.getByPlaceholderText(/search by name, category/i), { target: { value: 'connectivity' } });
        expect(screen.getByText('20GB Bundle')).toBeInTheDocument();
        expect(screen.queryByText('Galaxy A15')).not.toBeInTheDocument();
    });

    it('a service without a model or manufacturer shows its category instead, with no blank tags', async () => {
        render(<DeviceCatalogScreen />);
        await screen.findByRole('tablist');
        const card = screen.getByText('20GB Bundle').closest('.card-hover');
        expect(within(card).getByText('Data & Connectivity')).toBeInTheDocument();
        expect(within(card).getByText('Monthly 20GB')).toBeInTheDocument();
        expect(card.textContent).not.toMatch(/null|undefined/);
    });

    it('with one category, or an older server without categories, there are no chips and nothing breaks', async () => {
        mockApi.getAvailableDevices.mockResolvedValue({ data: { data: { devices: [phone] } } });
        mockApi.getCategories.mockRejectedValue(new Error('404'));
        render(<DeviceCatalogScreen />);
        expect(await screen.findByText('Galaxy A15')).toBeInTheDocument();
        expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });

    it('an empty category explains itself and the filters can be cleared', async () => {
        render(<DeviceCatalogScreen />);
        await screen.findByRole('tablist');
        fireEvent.change(screen.getByPlaceholderText(/search by name, category/i), { target: { value: 'zzz' } });
        expect(screen.getByText(/nothing matches "zzz"/i)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));
        expect(screen.getByText('Galaxy A15')).toBeInTheDocument();
    });
});
