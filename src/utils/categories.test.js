import { categoryChips, categoryIcon } from './categories';
import { IoPhonePortraitOutline, IoTabletPortraitOutline, IoLaptopOutline, IoWifiOutline, IoCellularOutline, IoHeadsetOutline, IoCubeOutline } from 'react-icons/io5';

const item = (id, category_id, category_name) => ({ device_id: id, category_id, category_name });

describe('categoryChips', () => {
    it('counts the items per category and follows the order the Admin set', () => {
        const devices = [item(1, 5, 'Data & Connectivity'), item(2, 1, 'Mobile Phones'), item(3, 1, 'Mobile Phones'), item(4, 3, 'Laptops & Computers')];
        const known = [{ category_id: 1 }, { category_id: 3 }, { category_id: 5 }, { category_id: 9 }];
        expect(categoryChips(devices, known)).toEqual([
            { id: 1, name: 'Mobile Phones', count: 2 },
            { id: 3, name: 'Laptops & Computers', count: 1 },
            { id: 5, name: 'Data & Connectivity', count: 1 },
        ]);
    });

    it('leaves out categories with nothing on offer', () => {
        expect(categoryChips([item(1, 1, 'Mobile Phones')], [{ category_id: 1 }, { category_id: 2 }]).map((c) => c.id)).toEqual([1]);
    });

    it('falls back to the order of first appearance for an older server, and ignores items without a category', () => {
        const devices = [item(1, 2, 'Tablets'), item(2, 1, 'Mobile Phones'), { device_id: 3 }];
        expect(categoryChips(devices, []).map((c) => c.name)).toEqual(['Tablets', 'Mobile Phones']);
    });
});

describe('categoryIcon', () => {
    it.each([
        ['Mobile Phones', IoPhonePortraitOutline], ['Tablets', IoTabletPortraitOutline], ['Laptops & Computers', IoLaptopOutline],
        ['Routers & MiFi', IoWifiOutline], ['Data & Connectivity', IoCellularOutline], ['Accessories', IoHeadsetOutline],
        ['Other Services', IoCubeOutline], ['Printers', IoCubeOutline], [undefined, IoCubeOutline],
    ])('%s', (name, icon) => expect(categoryIcon(name)).toBe(icon));
});
