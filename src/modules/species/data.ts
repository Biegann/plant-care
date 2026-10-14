// Wbudowana lista gatunków: typowe zalecenia ogrodnicze, nie porady eksperta.
// Teksty wskazówek są w tłumaczeniach (species.light.*, species.watering.* itd.),
// tu tylko kategorie i liczby

// Światło: low = cień lub słabe światło, medium = półcień, bright = jasne
// rozproszone (bez ostrego słońca), direct = pełne słońce
export type Light = "low" | "medium" | "bright" | "direct";
// Kiedy podlewać: topDry = gdy wierzch ziemi przeschnie, halfDry = gdy połowa
// ziemi przeschnie, fullyDry = gdy ziemia całkiem wyschnie, keepMoist = ziemia
// stale lekko wilgotna, orchid = gdy korzenie zrobią się srebrzyste
export type WaterHint =
  "topDry" | "halfDry" | "fullyDry" | "keepMoist" | "orchid";
export type Humidity = "low" | "medium" | "high";

export type Species = {
  key: string;
  latin: string;
  names: { pl: string; en: string };
  light: Light;
  // Podpowiedź interwału zadań w dniach (podlewanie latem, nawożenie w sezonie)
  waterDays: number;
  waterHint: WaterHint;
  fertilizeDays: number;
  humidity: Humidity;
  // Trująca dla kotów lub psów
  toxicPets: boolean;
};

type Row = [
  key: string,
  latin: string,
  pl: string,
  en: string,
  light: Light,
  waterDays: number,
  waterHint: WaterHint,
  fertilizeDays: number,
  humidity: Humidity,
  toxicPets: boolean,
];

// prettier-ignore
const ROWS: Row[] = [
  // ===== Rośliny doniczkowe liściaste =====
  ["monstera-deliciosa", "Monstera deliciosa", "Monstera dziurawa", "Swiss cheese plant", "bright", 9, "topDry", 30, "high", true],
  ["epipremnum-aureum", "Epipremnum aureum", "Epipremnum złociste (scindapsus)", "Golden pothos", "medium", 9, "topDry", 30, "medium", true],
  ["dracaena-trifasciata", "Dracaena trifasciata", "Sansewieria (wężownica)", "Snake plant", "medium", 21, "fullyDry", 60, "low", true],
  ["zamioculcas-zamiifolia", "Zamioculcas zamiifolia", "Zamiokulkas zamiolistny", "ZZ plant", "medium", 21, "fullyDry", 60, "low", true],
  ["spathiphyllum-wallisii", "Spathiphyllum wallisii", "Skrzydłokwiat", "Peace lily", "medium", 7, "topDry", 30, "high", true],
  ["chlorophytum-comosum", "Chlorophytum comosum", "Zielistka Sternberga", "Spider plant", "bright", 7, "topDry", 30, "medium", false],
  ["ficus-elastica", "Ficus elastica", "Fikus sprężysty (gumowiec)", "Rubber plant", "bright", 10, "topDry", 30, "medium", true],
  ["ficus-lyrata", "Ficus lyrata", "Fikus lirolistny", "Fiddle-leaf fig", "bright", 10, "topDry", 30, "medium", true],
  ["ficus-benjamina", "Ficus benjamina", "Fikus benjamina", "Weeping fig", "bright", 7, "topDry", 30, "medium", true],
  ["dracaena-marginata", "Dracaena marginata", "Dracena obrzeżona", "Dragon tree", "medium", 14, "halfDry", 45, "medium", true],
  ["dracaena-fragrans", "Dracaena fragrans", "Dracena wonna", "Corn plant", "medium", 10, "topDry", 45, "medium", true],
  ["philodendron-hederaceum", "Philodendron hederaceum", "Filodendron pnący", "Heartleaf philodendron", "medium", 7, "topDry", 30, "medium", true],
  ["calathea", "Calathea (Goeppertia)", "Kalatea", "Calathea", "medium", 5, "keepMoist", 30, "high", false],
  ["maranta-leuconeura", "Maranta leuconeura", "Maranta białożyłkowa", "Prayer plant", "medium", 5, "keepMoist", 30, "high", false],
  ["strelitzia-reginae", "Strelitzia reginae", "Strelicja królewska", "Bird of paradise", "bright", 10, "topDry", 30, "medium", true],
  ["chamaedorea-elegans", "Chamaedorea elegans", "Chamedora wytworna", "Parlor palm", "medium", 7, "topDry", 30, "medium", false],
  ["dypsis-lutescens", "Dypsis lutescens", "Areka (palma złocista)", "Areca palm", "bright", 7, "topDry", 30, "high", false],
  ["nephrolepis-exaltata", "Nephrolepis exaltata", "Nefrolepis wyniosły (paproć)", "Boston fern", "medium", 4, "keepMoist", 30, "high", false],
  ["asplenium-nidus", "Asplenium nidus", "Zanokcica gniazdowa", "Bird's nest fern", "medium", 5, "keepMoist", 30, "high", false],
  ["aglaonema", "Aglaonema", "Aglaonema", "Chinese evergreen", "low", 10, "topDry", 45, "medium", true],
  ["dieffenbachia", "Dieffenbachia", "Difenbachia", "Dumb cane", "medium", 7, "topDry", 30, "medium", true],
  ["alocasia", "Alocasia", "Alokazja", "Elephant ear", "bright", 7, "topDry", 30, "high", true],
  ["syngonium-podophyllum", "Syngonium podophyllum", "Zroślicha (syngonium)", "Arrowhead plant", "medium", 7, "topDry", 30, "medium", true],
  ["hedera-helix", "Hedera helix", "Bluszcz pospolity", "English ivy", "medium", 7, "topDry", 30, "medium", true],
  ["tradescantia-zebrina", "Tradescantia zebrina", "Trzykrotka zebrina", "Inch plant", "bright", 7, "topDry", 30, "medium", true],
  ["pilea-peperomioides", "Pilea peperomioides", "Pilea peperomiowata", "Chinese money plant", "bright", 7, "topDry", 30, "medium", false],
  ["peperomia-obtusifolia", "Peperomia obtusifolia", "Peperomia tępolistna", "Baby rubber plant", "medium", 10, "halfDry", 45, "medium", false],
  ["schefflera-arboricola", "Schefflera arboricola", "Szeflera drzewkowata", "Dwarf umbrella tree", "bright", 10, "topDry", 30, "medium", true],
  ["aspidistra-elatior", "Aspidistra elatior", "Aspidistra wyniosła", "Cast iron plant", "low", 14, "halfDry", 60, "low", false],
  ["oxalis-triangularis", "Oxalis triangularis", "Szczawik trójkątny", "Purple shamrock", "bright", 7, "topDry", 30, "medium", true],
  ["hoya-carnosa", "Hoya carnosa", "Hoja (woskownica) mięsista", "Wax plant", "bright", 10, "halfDry", 30, "medium", false],
  ["yucca-elephantipes", "Yucca elephantipes", "Juka gwatemalska", "Spineless yucca", "direct", 14, "halfDry", 45, "low", true],
  ["beaucarnea-recurvata", "Beaucarnea recurvata", "Nolina odgięta (beaukarnea)", "Ponytail palm", "direct", 21, "fullyDry", 60, "low", false],

  // ===== Sukulenty i kaktusy =====
  ["aloe-vera", "Aloe vera", "Aloes zwyczajny", "Aloe vera", "direct", 21, "fullyDry", 60, "low", true],
  ["crassula-ovata", "Crassula ovata", "Grubosz jajowaty", "Jade plant", "direct", 21, "fullyDry", 60, "low", true],
  ["cactaceae", "Cactaceae", "Kaktus", "Cactus", "direct", 21, "fullyDry", 60, "low", false],
  ["echeveria", "Echeveria", "Eszeweria", "Echeveria", "direct", 14, "fullyDry", 60, "low", false],
  ["haworthia", "Haworthia", "Haworsja", "Haworthia", "bright", 14, "fullyDry", 60, "low", false],
  ["senecio-rowleyanus", "Senecio rowleyanus", "Starzec Rowleya", "String of pearls", "bright", 14, "fullyDry", 60, "low", true],
  ["ceropegia-woodii", "Ceropegia woodii", "Ceropegia Wooda", "String of hearts", "bright", 14, "halfDry", 45, "low", false],
  ["kalanchoe-blossfeldiana", "Kalanchoe blossfeldiana", "Kalanchoe Blossfelda", "Flaming Katy", "direct", 14, "fullyDry", 30, "low", true],
  ["schlumbergera", "Schlumbergera", "Grudnik (kaktus bożonarodzeniowy)", "Christmas cactus", "bright", 7, "topDry", 30, "medium", false],

  // ===== Rośliny kwitnące w domu =====
  ["phalaenopsis", "Phalaenopsis", "Storczyk falenopsis", "Moth orchid", "bright", 7, "orchid", 14, "medium", false],
  ["anthurium-andraeanum", "Anthurium andraeanum", "Anturium Andrégo", "Flamingo flower", "bright", 7, "topDry", 30, "high", true],
  ["saintpaulia", "Saintpaulia", "Fiołek afrykański", "African violet", "bright", 5, "topDry", 21, "medium", false],
  ["begonia", "Begonia", "Begonia", "Begonia", "bright", 7, "topDry", 30, "medium", true],
  ["cyclamen-persicum", "Cyclamen persicum", "Cyklamen perski", "Cyclamen", "bright", 5, "topDry", 21, "medium", true],
  ["euphorbia-pulcherrima", "Euphorbia pulcherrima", "Gwiazda betlejemska", "Poinsettia", "bright", 7, "topDry", 30, "medium", true],
  ["citrus-limon", "Citrus limon", "Cytryna", "Lemon tree", "direct", 7, "topDry", 14, "medium", true],

  // ===== Balkon, taras, zioła =====
  ["pelargonium", "Pelargonium", "Pelargonia", "Geranium", "direct", 3, "topDry", 14, "low", true],
  ["petunia", "Petunia", "Petunia", "Petunia", "direct", 2, "topDry", 7, "medium", false],
  ["fuchsia", "Fuchsia", "Fuksja", "Fuchsia", "medium", 3, "keepMoist", 14, "medium", false],
  ["hydrangea-macrophylla", "Hydrangea macrophylla", "Hortensja ogrodowa", "Hydrangea", "medium", 3, "keepMoist", 14, "medium", true],
  ["rosa", "Rosa", "Róża", "Rose", "direct", 4, "topDry", 14, "medium", false],
  ["buxus-sempervirens", "Buxus sempervirens", "Bukszpan", "Boxwood", "bright", 7, "topDry", 30, "medium", true],
  ["lavandula-angustifolia", "Lavandula angustifolia", "Lawenda wąskolistna", "Lavender", "direct", 7, "halfDry", 30, "low", true],
  ["salvia-rosmarinus", "Salvia rosmarinus", "Rozmaryn", "Rosemary", "direct", 7, "halfDry", 30, "low", false],
  ["ocimum-basilicum", "Ocimum basilicum", "Bazylia", "Basil", "direct", 2, "keepMoist", 14, "medium", false],
  ["mentha", "Mentha", "Mięta", "Mint", "bright", 3, "keepMoist", 21, "medium", true],
  ["solanum-lycopersicum", "Solanum lycopersicum", "Pomidor", "Tomato", "direct", 2, "keepMoist", 14, "medium", true],
  ["fragaria", "Fragaria × ananassa", "Truskawka", "Strawberry", "direct", 3, "keepMoist", 14, "medium", false],
];

export const SPECIES: Species[] = ROWS.map(
  ([
    key,
    latin,
    pl,
    en,
    light,
    waterDays,
    waterHint,
    fertilizeDays,
    humidity,
    toxicPets,
  ]) => ({
    key,
    latin,
    names: { pl, en },
    light,
    waterDays,
    waterHint,
    fertilizeDays,
    humidity,
    toxicPets,
  }),
);

const BY_KEY = new Map(SPECIES.map((species) => [species.key, species]));

// Podpowiedzi interwałów zadań dla gatunku (puste, gdy gatunku nie ma na liście)
export function speciesIntervals(key: string | null | undefined): {
  water?: number;
  fertilize?: number;
} {
  const species = findSpecies(key);
  return species
    ? { water: species.waterDays, fertilize: species.fertilizeDays }
    : {};
}

export function findSpecies(key: string | null | undefined): Species | null {
  return key ? (BY_KEY.get(key) ?? null) : null;
}
