import Collector from '../src/service/collector';
import {Filters} from "../src/interfaces/settings";

test('Links with filters', () => {
    let filters: Filters = {
        flat: ["max-500","pets","newly","room-3", "condi", "furnished"],
        house: ["price-150", "max-250", "pets", "condi", "furnished"]
    };

    let urls = new Collector(367825282, filters).getUrls();

    expect(urls.length).toBe(5);
    expect(urls).toEqual([
            'https://tappancsosotthon.hu/',
            'https://realestatehungary.hu/szukites/kiado+kisallat-hozhato+uj-epitesu+3-szoba-felett+van-legkondi+butorozott+lakas+budapest+havi-500-ezer-Ft-ig?page=1',
            'https://en.alberlet.hu/kiado_alberlet/page:1/haziallat-engedelyezve:igen/ujszeru:igen/szoba:3-x/klima:igen/berendezes:2/ingatlan-tipus:lakas/megye:budapest/berleti-dij:0-500-ezer-ft/limit:100',
            'https://realestatehungary.hu/szukites/kiado+kisallat-hozhato+van-legkondi+butorozott+haz+budapest+havi-150-250-ezer-Ft?page=1',
            'https://en.alberlet.hu/kiado_alberlet/page:1/haziallat-engedelyezve:igen/klima:igen/berendezes:2/ingatlan-tipus:haz/megye:budapest/berleti-dij:150-250-ezer-ft/limit:100'
        ]
    );
});