import { fetchAuthConfig, resetAuthConfigCache, microsoftSignInUrl, LOCAL_AUTH } from './authConfig';

const mockGetConfig = jest.fn();
jest.mock('./api', () => ({
    API_BASE_URL: 'https://api.example.gov.za/api',
    authAPI: { getConfig: (...a) => mockGetConfig(...a) },
}));

beforeEach(() => { jest.clearAllMocks(); resetAuthConfigCache(); });

describe('fetchAuthConfig', () => {
    it('returns what the server says and remembers it', async () => {
        mockGetConfig.mockResolvedValue({ data: { provider: 'entra', directory: true, loginMethod: 'microsoft', selfRegistration: false } });
        expect(await fetchAuthConfig()).toMatchObject({ provider: 'entra', loginMethod: 'microsoft', selfRegistration: false, passwordManagedLocally: true });
        await fetchAuthConfig();
        expect(mockGetConfig).toHaveBeenCalledTimes(1);
    });

    it('treats an older server, or one that cannot be reached, as local sign-in and asks again next time', async () => {
        mockGetConfig.mockRejectedValueOnce(new Error('404'));
        expect(await fetchAuthConfig()).toEqual(LOCAL_AUTH);
        mockGetConfig.mockResolvedValueOnce({ data: { provider: 'ldap', directory: true, selfRegistration: false } });
        expect((await fetchAuthConfig()).provider).toBe('ldap');
    });

    it('lets clients register and reset passwords when the server says clientRegistration, even in a directory mode', async () => {
        mockGetConfig.mockResolvedValue({ data: { provider: 'entra', directory: true, loginMethod: 'microsoft', selfRegistration: false, passwordManagedLocally: false, clientRegistration: true } });
        expect(await fetchAuthConfig()).toMatchObject({ loginMethod: 'microsoft', selfRegistration: true, passwordManagedLocally: true });
    });

    it('keeps registration closed when the server says clientRegistration is false', async () => {
        mockGetConfig.mockResolvedValue({ data: { provider: 'ldap', directory: true, selfRegistration: false, passwordManagedLocally: false, clientRegistration: false } });
        expect(await fetchAuthConfig()).toMatchObject({ selfRegistration: false, passwordManagedLocally: false });
    });

    it('ignores an answer that is not a sign-in configuration', async () => {
        mockGetConfig.mockResolvedValue({ data: null });
        expect(await fetchAuthConfig()).toEqual(LOCAL_AUTH);
    });
});

describe('microsoftSignInUrl', () => {
    it('starts the client sign-in on the API and asks to come back to /auth/callback', () => {
        const url = new URL(microsoftSignInUrl('https://client.example.gov.za'));
        expect(url.origin + url.pathname).toBe('https://api.example.gov.za/api/auth/entra/login');
        expect(url.searchParams.get('audience')).toBe('client');
        expect(url.searchParams.get('redirect')).toBe('https://client.example.gov.za/auth/callback');
    });
});
