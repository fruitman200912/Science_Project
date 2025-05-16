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
let placeIdCache = {};
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
  // 필요시 계속 추가 가능
};

async function getPlaceIdByCountryName(countryName) {
  if (placeIdCache[countryName]) return placeIdCache[countryName];

  const res = await axios.get(`https://api.inaturalist.org/v1/places/autocomplete?q=${encodeURIComponent(countryName)}`);
  const match = res.data.results.find(p =>
    (p.admin_level === 0 || p.admin_level === null) &&
    p.display_name.toLowerCase().includes(countryName.toLowerCase())
  );

  if (match) {
    placeIdCache[countryName] = match.id;
    return match.id;
  }
  return null;
}

async function loadSpecies() {
  const input = document.getElementById('Search').value.trim();
  if (!input) return;

  console.clear();
  console.log("검색어:", input);

  //자동완성
  const autoResp = await axios.get(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(input)}`);
  console.log("자동완성 결과:", autoResp.data.results);
  if (!autoResp.data.results.length) return alert("해당 종을 찾을 수 없습니다.");
  const taxonName = autoResp.data.results[0].name;
  console.log("검색된 종 이름:", taxonName);

  const worldData = await fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson").then(r => r.json());

  const features = worldData.features;
  const placeIdMap = {};

  await Promise.all(features.map(async (feature) => {
    const country = feature.properties.ADMIN;
    const placeId = await getPlaceIdByCountryName(country);
    if (placeId) {
      placeIdMap[country] = placeId;
    }
  }));

  console.log("매핑된 국가 수:", Object.keys(placeIdMap).length);

  const observationPromises = Object.entries(placeIdMap).map(async ([country, placeId]) => {
    const obsResp = await axios.get(`https://api.inaturalist.org/v1/observations?taxon_name=${taxonName}&verifiable=true&place_id=${placeId}&per_page=1`);
    const count = obsResp.data.total_results || 0;
    console.log(`${country} (${placeId}): ${count}`)
    return { country, count };
  });

  const observationResults = await Promise.all(observationPromises)
  countryCounts = {};
  for (let { country, count } of observationResults) {
    countryCounts[country] = count;
  }

  console.log("관측 결과 수:", countryCounts);

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
      const rawName = feature
      const countryName = feature.properties.ADMIN;
      const count = countryCounts[countryName];
      return {
        fillColor: count ? getColor(count) : "#eee",
        fillOpacity: count ? 0.8 : 0.3,
        color: "white",
        weight: 1
      };
    },

    onEachFeature: function (feature, layer) {
      const countryName = feature.properties.ADMIN;
      const count = countryCounts[countryName];

      layer.bindTooltip(count ? `${countryName}: ${count}건 관측` : `${countryName}: 관측 없음`,
        { sticky: true }
      );

      layer.on({
        mouseover: function (e) {
          const layer = e.target;
          layer.setStyle({
            fillOpacity: 0.9,
            weight: 2,
            color: 'black'
          });
          layer.openTooltip();
        },
        mouseout: function (e) {
          if (geojsonLayer && geojsonLayer.resetStyle) {
            geojsonLayer.resetStyle(e.target);
          }
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
