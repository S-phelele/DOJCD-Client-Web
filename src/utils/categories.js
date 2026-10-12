import {
    IoPhonePortraitOutline, IoTabletPortraitOutline, IoLaptopOutline, IoWifiOutline,
    IoCellularOutline, IoHeadsetOutline, IoCubeOutline,
} from 'react-icons/io5';

// An icon that suits a catalogue category, chosen from its name (categories are set up by Admins, so any
// name can appear; unknown ones get a neutral box).
export function categoryIcon(name = '') {
    const n = String(name).toLowerCase();
    if (/phone|mobile/.test(n))                    return IoPhonePortraitOutline;
    if (/tablet/.test(n))                          return IoTabletPortraitOutline;
    if (/laptop|computer|notebook|desktop/.test(n)) return IoLaptopOutline;
    if (/router|mifi|wi-?fi|hotspot/.test(n))      return IoWifiOutline;
    if (/data|sim|connect/.test(n))                return IoCellularOutline;
    if (/accessor|headset|charger|case/.test(n))   return IoHeadsetOutline;
    return IoCubeOutline;
}

// The filter chips: categories that have at least one item on offer, in the order the Admin set, with counts.
// `known` is the server's ordered category list (may be empty for an older server: then the order of first appearance is used).
export function categoryChips(devices, known = []) {
    const counts = new Map();
    for (const d of devices) {
        if (d.category_id == null) continue;
        const entry = counts.get(d.category_id) || { id: d.category_id, name: d.category_name || 'Other', count: 0 };
        entry.count += 1;
        counts.set(d.category_id, entry);
    }
    const ordered = [];
    for (const c of known) if (counts.has(c.category_id)) { ordered.push(counts.get(c.category_id)); counts.delete(c.category_id); }
    return [...ordered, ...counts.values()];
}
