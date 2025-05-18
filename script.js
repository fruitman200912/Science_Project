const map = L.map('map', {
  dragging: false,
  keyboard: false,
  zoomControl: false,
  center: [90, 0],
  zoom: 2,
  minZoom: 2,
  maxZoom: 4,
  maxBounds: [
    [-85, -180],
    [85, 180]
  ],
  maxBoundsViscosity: 1.0
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  noWrap: true
}).addTo(map);

let geojsonLayer = null;
let countryCounts = {};
let getColor = count => '#ccc';

const countryNameMap = {
  "Republic of Korea": "South Korea",
  "Democratic People's Republic of Korea": "North Korea",
  "Russian Federation": "Russia",
  "United States of America": "United States",
  "Czechia": "Czech Republic",
  "Viet Nam": "Vietnam",
  "Iran (Islamic Republic of)": "Iran",
  "Lao People's Democratic Republic": "Laos",
  "Syrian Arab Republic": "Syria",
  "Venezuela (Bolivarian Republic of)": "Venezuela",
  "Bolivia (Plurinational State of)": "Bolivia",
  "United Republic of Tanzania": "Tanzania",
  "Brunei Darussalam": "Brunei"
  // 필요시 계속 추가
};

<<<<<<< HEAD
=======
async function getPlaceIdByCountryName(name) {
  if (placeIdCache[name]) return placeIdCache[name];

  const res = await axios.get(`https://api.inaturalist.org/v1/places/autocomplete?q=${encodeURIComponent(name)}&per_page=10`);
  const match = res.data.results.find(p => {
    const display = (p.display_name || "").toLowerCase();
    const short = (p.name || "").toLowerCase();
    const target = name.toLowerCase();
    return display.includes(target) || short.includes(target);
  });

  if (match) {
    placeIdCache[name] = match.id;
    return match.id;
  }

  console.warn(`국가 매핑 실패: ${name}`);
  return null;
}

>>>>>>> ac7e3dd (커밋)
async function loadSpecies() {
  const input = document.getElementById('Search').value.trim();
  if (!input) return;
  console.clear();

  const autoResp = await axios.get(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(input)}`);
  const first = autoResp.data.results[0];
  if (!first) return alert("해당 종을 찾을 수 없습니다.");
  const taxonId = first.id;

<<<<<<< HEAD
  const placeList = await axios.get(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeUTIComponent(input)}`)
    .then(res => res.data.results);

  const worldData = await fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
    .then(r => r.json());
=======
  const worldData = await fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
    .then(r => r.json());

  console.log("샘플 국가 속성:", worldData.features[0].properties);
>>>>>>> ac7e3dd (커밋)

  const features = worldData.features;
  const placeIdMap = {};

  for (const feature of features) {
<<<<<<< HEAD
    const rawName = feature.properties.ADMIN;
    const iNatName = countryNameMap[rawName] || rawName;
    const match = placeList.find(p =>
      p.display_name.toLowerCase() === iNatName.toLowerCase() ||
      p.name.toLowerCase() === iNatName.toLowerCase()
    );

    if (match) {
      placeIdMap[rawName] = match.id;
    } else {
      console.warn(`매핑 실패: ${rawName} -> ${iNatName}`);
=======
    const rawName = feature.properties.ADMIN || feature.properties.name || feature.properties.NAME_LONG;
    const iNatName = countryNameMap[rawName] || rawName;
    if (!iNatName) {
      console.warn(`iNatName이 undefined입니다: ${rawName}`);
      continue;
    }
    const placeId = await getPlaceIdByCountryName(iNatName);
    if (placeId) {
      placeIdMap[rawName] = placeId;
>>>>>>> ac7e3dd (커밋)
    }
  }

  const observationPromises = Object.entries(placeIdMap).map(async ([country, placeId]) => {
    const res = await axios.get(
<<<<<<< HEAD
      `https://api.inaturalist.org/v1/observations?taxon_id=${taxonId}$place_id=${placeId}&verifiable=true&per_page=1`
=======
      `https://api.inaturalist.org/v1/observations?taxon_id=${taxonId}&place_id=${placeId}&verifiable=true&per_page=1`
>>>>>>> ac7e3dd (커밋)
    );
    const count = res.data.total_results;
    return { country, count };
  });

  const observationResults = await Promise.all(observationPromises);
  countryCounts = {};
  for (let { country, count } of observationResults) {
    countryCounts[country] = count;
  }

  const maxCount = Math.max(...Object.values(countryCounts), 1);
  getColor = function (count) {
    const step = maxCount / 5;
    return count > step * 4 ? '#084081' :
      count > step * 3 ? '#0868ac' :
        count > step * 2 ? '#2b8cbe' :
          count > step ? '#4eb3d3' :
            '#7bccc4';
  };

  if (geojsonLayer) map.removeLayer(geojsonLayer);

  geojsonLayer = L.geoJSON(worldData, {
    style: feature => {
      const rawName = feature.properties.ADMIN;
      const count = countryCounts[rawName];
      return {
        fillColor: count ? getColor(count) : "#eee",
        fillOpacity: count ? 0.8 : 0.3,
        color: "white",
        weight: 1
      };
    },
<<<<<<< HEAD
    onEachFeature: function (feature, layer) {
      const rawName = feature.properties.ADMIN;
=======
    onEachFeature: (feature, layer) => {
      const rawName = feature.properties.ADMIN;
      const countryName = countryNameMap[rawName] || rawName;
>>>>>>> ac7e3dd (커밋)
      const count = countryCounts[rawName];

      layer.bindTooltip(count ? `${countryName}: ${count}건 관측` : `${countryName}: 관측 없음`, {
        sticky: true
      });

      layer.on({
        mouseover: e => {
          const l = e.target;
          l.setStyle({ fillOpacity: 0.9, weight: 2, color: 'black' });
          l.openTooltip();
        },
        mouseout: e => {
          geojsonLayer.resetStyle(e.target);
          e.target.closeTooltip();
        }
      });
    }
  }).addTo(map);
}

document.getElementById("Search").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    loadSpecies();
  }
});