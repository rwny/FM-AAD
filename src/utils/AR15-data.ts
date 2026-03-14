// Auto-generated from AR15.md
// Run: npm run generate:ar15

export const buildingData = {
  "building": "AR15",
  "name": "Shop ดำ",
  "floors": [
    {
      "floor": 1,
      "rooms": [
        {
          "id": "rm-101",
          "number": "101",
          "name": "ประประชุม 1",
          "floor": 1,
          "systems": [
            "AR",
            "FUR",
            "EE",
            "AC"
          ],
          "assets": []
        },
        {
          "id": "rm-101.1",
          "number": "101.1",
          "name": "ห้องเก็บของ",
          "floor": 1,
          "systems": [],
          "assets": []
        },
        {
          "id": "rm-102",
          "number": "102",
          "name": "Room 102",
          "floor": 1,
          "systems": [],
          "assets": []
        },
        {
          "id": "rm-103",
          "number": "103",
          "name": "Room 103",
          "floor": 1,
          "systems": [],
          "assets": []
        },
        {
          "id": "rm-104",
          "number": "104",
          "name": "Room 104",
          "floor": 1,
          "systems": [],
          "assets": []
        },
        {
          "id": "rm-105",
          "number": "105",
          "name": "Room 105",
          "floor": 1,
          "systems": [],
          "assets": []
        },
        {
          "id": "rm-106",
          "number": "106",
          "name": "Room 106",
          "floor": 1,
          "systems": [],
          "assets": []
        },
        {
          "id": "rm-107",
          "number": "107",
          "name": "Room 107",
          "floor": 1,
          "systems": [],
          "assets": []
        },
        {
          "id": "rm-108",
          "number": "108",
          "name": "Room 108",
          "floor": 1,
          "systems": [],
          "assets": []
        },
        {
          "id": "rm-109",
          "number": "109",
          "name": "Room 109",
          "floor": 1,
          "systems": [],
          "assets": []
        },
        {
          "id": "rm-110",
          "number": "110",
          "name": "Room 110",
          "floor": 1,
          "systems": [],
          "assets": []
        }
      ]
    },
    {
      "floor": 2,
      "rooms": []
    }
  ]
};

export const getAllAssets = () => {
  return buildingData.floors.flatMap(f => f.rooms.flatMap(r => r.assets));
};

export const getAssetsByRoom = (roomId) => {
  return getAllAssets().filter(a => a.room === roomId);
};

export const getAssetsByFloor = (floor) => {
  return getAllAssets().filter(a => a.floor === floor);
};

export const getAssetsByStatus = (status) => {
  return getAllAssets().filter(a => a.status === status);
};

export const getAssetsByCategory = (category) => {
  return getAllAssets().filter(a => a.category === category);
};

export const getAssetLogs = (assetId) => {
  const asset = getAllAssets().find(a => a.id === assetId);
  return asset?.logs || [];
};

export const getAssetsByType = (typeId) => {
  return getAllAssets().filter(a => a.typeId === typeId);
};
