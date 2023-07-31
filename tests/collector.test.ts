import Collector from '../src/service/collector';
import Filters from "../src/dto/filters";
import {RentWithPaws} from "../src/provider/rentWithPaws";
import {Ingatlan} from "../src/provider/ingatlan";
import crypto from "crypto";
import Halooglasi from "../src/provider/serbia/halooglasi";
import Location from "../src/enums/location";

test('Links with filters', () => {
    let filters = new Filters({
        flat: ["max-500", "pets", "newly", "room-3", "condi", "furnished"],
        house: ["price-150", "max-250", "pets", "condi", "furnished"]
    });

    let urls = new Collector(367825282, filters).getUrls();

    expect(urls.length).toBe(5);
    expect(urls).toEqual([
            'https://tappancsosotthon.hu/',
            'https://ingatlan.com/szukites/kiado+kisallat-hozhato+uj-epitesu+3-szoba-felett+van-legkondi+butorozott+lakas+budapest+havi-500-ezer-Ft-ig?page=1',
            'https://en.alberlet.hu/kiado_alberlet/page:1/haziallat-engedelyezve:igen/ujszeru:igen/szoba:3-x/klima:igen/berendezes:2/ingatlan-tipus:lakas/megye:budapest/berleti-dij:0-500-ezer-ft/limit:100',
            'https://ingatlan.com/szukites/kiado+kisallat-hozhato+van-legkondi+butorozott+haz+budapest+havi-150-250-ezer-Ft?page=1',
            'https://en.alberlet.hu/kiado_alberlet/page:1/haziallat-engedelyezve:igen/klima:igen/berendezes:2/ingatlan-tipus:haz/megye:budapest/berleti-dij:150-250-ezer-ft/limit:100'
        ]
    );
});

test('Serbian links with filters', () => {
    let filters = new Filters({
        flat: ["max-500", "pets", "newly", "room-3", "condi", "furnished"],
        house: ["price-150", "max-250", "pets", "condi", "furnished"],
        location: Location.BELGRADE
    });

    let urls = new Collector(367825282, filters).getUrls();

    expect(urls.length).toBe(2);
    expect(urls).toEqual([
            "https://www.halooglasi.com/nekretnine/izdavanje-stanova/beograd?cena_d_to=500&dodatno_id_ls=12000009&tip_objekta_id_l=387235&broj_soba_order_i_from=3&ostalo_id_ls=12100002&namestenost_id_l=562&page=1",
            "https://www.halooglasi.com/nekretnine/izdavanje-kuca/beograd?cena_d_from=150&cena_d_to=250&dodatno_id_ls=12000009&ostalo_id_ls=12100002&namestenost_id_l=562&page=1"
        ]
    );
});

test('Links with new location', () => {
    let filters = new Filters({
        flat: ["max-500", "pets", "newly", "room-3", "condi", "furnished"],
        house: ["price-150", "max-250", "pets", "condi", "furnished"],
        location: 'beograd'
    });

    let urls = new Collector(367825282, filters).getUrls();

    expect(urls.length).toBe(0);
});

test('Test collector data fetching', async () => {
    let filters = new Filters({
        flat: ["max-500", "pets", "newly", "room-3", "condi", "furnished"],
        house: [],
    });

    let rentWithPawsProvider = new RentWithPaws();
    jest.spyOn(rentWithPawsProvider, 'getData')
        .mockImplementation(() => new Promise((resolve) => resolve({"hash": {id: 1, price: 1, address: "test"}})));

    let rentWithPawsProvider2 = new RentWithPaws();
    jest.spyOn(rentWithPawsProvider2, 'getData')
        .mockImplementation(() => new Promise((resolve) => {
            throw new Error('Error from second provider')
        }));

    let collector = new Collector(367825282, filters);
    collector.providers = [rentWithPawsProvider, rentWithPawsProvider2];

    jest.spyOn(collector, 'getCollection')
        .mockImplementation(() => new Promise((resolve) => resolve([])));

    jest.spyOn(collector, 'getCollection')
        .mockImplementation(() => new Promise((resolve) => resolve([])));

    jest.spyOn(collector, 'updateCollection')
        .mockImplementation(() => new Promise((resolve) => resolve(true)));

    let data = await collector.getData();

    expect(Array.isArray(data.newest)).toBeTruthy();
    expect(typeof data.result === 'object').toBeTruthy();
    expect(data.result).toHaveProperty('hash');
});

test('Test ingatlan change url', async () => {
    let provider = new Ingatlan(['flat', 'location']);
    provider.withPages = false;

    let data = await provider.getData();

    expect(typeof data === 'object').toBeTruthy();
    expect(Object.keys(data)).toHaveLength(20);

    for (let hash in data) {
        let item = data[hash];

        expect(hash).toBe(crypto.createHash('md5').update(item.id).digest('hex'));
        expect(item.id.includes('realestatehungary')).toBeTruthy();
        expect(item.url).toBeDefined()
        expect(item.url.includes('ingatlan')).toBeTruthy();
    }
});

test('Halooglasi provider', async () => {
    let provider = new Halooglasi(['flat', 'location']);
    provider.withPages = false;

    let data = await provider.getData();
    expect(typeof data === 'object').toBeTruthy();
    for (let hash in data) {
        let item = data[hash];

        expect(hash).toBe(crypto.createHash('md5').update(item.id).digest('hex'));
        expect(item.id.includes('www.halooglasi.com')).toBeTruthy();
    }
});