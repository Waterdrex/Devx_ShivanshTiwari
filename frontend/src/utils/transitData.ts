export interface MetroStation {
  name: string;
  coords: [number, number];
  isInterchange?: boolean;
}

export interface MetroLine {
  id: string;
  name: string;
  color: string;
  coordinates: [number, number][];
  stations: MetroStation[];
}

export const BENGALURU_METRO_LINES: MetroLine[] = [
  {
    id: 'purple_line',
    name: 'Namma Metro Purple Line (East-West)',
    color: '#9333ea', // Deep Purple
    coordinates: [
      [12.9961, 77.761], // Whitefield
      [12.985, 77.747], // Hopefarm
      [13.0012, 77.6965], // KR Puram
      [12.9906, 77.6527], // Baiyappanahalli
      [12.9784, 77.6408], // Indiranagar
      [12.9754, 77.6067], // MG Road
      [12.979, 77.599], // Cubbon Park
      [12.9774, 77.5728], // Majestic (Interchange)
      [12.969, 77.537], // Vijayanagar
      [12.946, 77.514], // Mysore Road
      [12.902, 77.467], // Challaghatta
    ],
    stations: [
      { name: 'Whitefield (Kadugodi)', coords: [12.9961, 77.761] },
      { name: 'KR Puram Station', coords: [13.0012, 77.6965] },
      { name: 'Indiranagar Metro', coords: [12.9784, 77.6408] },
      { name: 'MG Road Metro', coords: [12.9754, 77.6067] },
      { name: 'Majestic Central', coords: [12.9774, 77.5728], isInterchange: true },
      { name: 'Mysore Road', coords: [12.946, 77.514] },
    ],
  },
  {
    id: 'green_line',
    name: 'Namma Metro Green Line (North-South)',
    color: '#16a34a', // Emerald Green
    coordinates: [
      [13.0475, 77.5005], // Nagasandra
      [13.0232, 77.5502], // Yeshwanthpur
      [12.9985, 77.5555], // Rajajinagar
      [12.9774, 77.5728], // Majestic (Interchange)
      [12.962, 77.5765], // KR Market
      [12.9463, 77.5802], // Lalbagh
      [12.93, 77.58], // Jayanagar
      [12.9155, 77.5736], // Banashankari
      [12.8625, 77.544], // Silk Institute
    ],
    stations: [
      { name: 'Nagasandra', coords: [13.0475, 77.5005] },
      { name: 'Yeshwanthpur', coords: [13.0232, 77.5502] },
      { name: 'Majestic Central', coords: [12.9774, 77.5728], isInterchange: true },
      { name: 'Lalbagh Botanical', coords: [12.9463, 77.5802] },
      { name: 'Jayanagar 4th Block', coords: [12.93, 77.58] },
      { name: 'Silk Institute', coords: [12.8625, 77.544] },
    ],
  },
];
