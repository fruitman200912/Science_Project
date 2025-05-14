const map = L.map('map', {
  zoomControl: false,
  center: [100, 0],
  zoom: 2,
  minZoom: 2,
  maxZoom: 2,
  maxBounds: [
    [-85, -180],
    [85, 180]
  ],
  maxBoundsViscosity: 1.0
});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  noWrap: true
}).addTo(map);

fetch('world.geojson')
  .then(res => res.json())
  .then(geoData => {
    const geoLayer = L.geoJSON(geoData).addTo(map);
    map.fitBounds(geoLayer.getBounds());
  });

fetch('https://raw.githubusercontent.com/johan/world.geo.json/master.countries.geo.json')
  .then(res => res.json())
  .then(data => {

  });