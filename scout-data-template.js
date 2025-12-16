// scout-data-template.js
// This file shows how to manually configure scout data if PDF parsing doesn't work
// Or how to pre-load adventure loop information

// Example: Pre-configured adventure loop data
const adventureLoopData = {
    'Lion': [
        {
            sku: '660186',
            name: "Lion's Pride",
            description: 'House with heart design'
        }
    ],
    'Tiger': [
        {
            sku: '619914',
            name: 'Team Tiger',
            description: 'People pyramid design'
        }
    ],
    'Wolf': [
        {
            sku: '619938',
            name: 'Air of the Wolf',
            description: 'Cloud/wind design'
        },
        {
            sku: '619939',
            name: 'Code of the Wolf',
            description: 'Detective cap design'
        },
        {
            sku: '619937',
            name: 'Footsteps (Duty to God)',
            description: 'Footprints design'
        },
        {
            sku: '619949',
            name: 'Paws of Skill',
            description: 'Soccer/baseball design'
        },
        {
            sku: '619936',
            name: 'Running With the Pack',
            description: 'Running figures design'
        }
    ],
    'Bear': [
        {
            sku: '660252',
            name: 'Bobcat (Bear)',
            description: 'Bobcat face design'
        },
        {
            sku: '660254',
            name: 'Bear Strong',
            description: 'Heart with paw design'
        },
        {
            sku: '660402',
            name: 'Bear Habitat',
            description: 'Bear silhouette design'
        },
        {
            sku: '619966',
            name: 'Salmon Run',
            description: 'Bear catching fish design'
        }
    ]
};

// Example: Manual scout data entry
const manualScoutData = {
    dens: {
        'Lion': [
            {
                name: 'AJ R',
                adventures: ["Lion's Pride"]
            },
            {
                name: 'Avery W',
                adventures: ["Lion's Pride"]
            }
            // Add more scouts...
        ],
        'Tiger': [
            {
                name: 'Aarohi D',
                adventures: ['Team Tiger']
            }
            // Add more scouts...
        ],
        'Wolf': [
            {
                name: 'Blaine R',
                adventures: ['Air of the Wolf', 'Code of the Wolf', 'Running With the Pack']
            },
            {
                name: 'Charlie R',
                adventures: ['Footsteps (Duty to God)', 'Paws of Skill', 'Running With the Pack']
            }
            // Add more scouts...
        ],
        'Bear': [
            {
                name: 'Ethan Y',
                adventures: ['Bobcat (Bear)', 'Bear Strong', 'Bear Habitat']
            },
            {
                name: 'Ishan Yadava',
                adventures: ['Bobcat (Bear)', 'Bear Strong', 'Bear Habitat', 'Salmon Run']
            }
            // Add more scouts...
        ]
    }
};

// To use this data in your application:
// 1. Include this file in index.html: <script src="scout-data-template.js"></script>
// 2. In app.js, check if manualScoutData exists and use it if PDF parsing fails:
//    if (typeof manualScoutData !== 'undefined') {
//        appState.parsedData = manualScoutData;
//    }

// Common ScoutShop.org image URLs (for reference)
const scoutShopImageUrls = {
    '660186': 'https://www.scoutshop.org/cub-scout-lion-adventure-loop-lion-s-pride-660186.html',
    '619914': 'https://www.scoutshop.org/cub-scout-tiger-adventure-loop-team-tiger-619914.html',
    '619938': 'https://www.scoutshop.org/cub-scout-wolf-elective-adventure-loop-air-of-the-wolf-619938.html',
    '619939': 'https://www.scoutshop.org/cub-scout-wolf-elective-adventure-loop-code-of-the-wolf-619939.html',
    '619937': 'https://www.scoutshop.org/cub-scout-wolf-elective-adventure-loop-footsteps-619937.html',
    '619949': 'https://www.scoutshop.org/cub-scout-wolf-elective-adventure-loop-paws-of-skill-619949.html',
    '619936': 'https://www.scoutshop.org/cub-scout-wolf-elective-adventure-loop-running-with-the-pack-619936.html',
    '660252': 'https://www.scoutshop.org/cub-scout-bear-adventure-loop-bobcat-660252.html',
    '660254': 'https://www.scoutshop.org/cub-scout-bear-adventure-loop-bear-strong-660254.html',
    '660402': 'https://www.scoutshop.org/cub-scout-bear-adventure-loop-bear-habitat-660402.html',
    '619966': 'https://www.scoutshop.org/cub-scout-bear-elective-adventure-loop-salmon-run-619966.html'
};
