const map = L.map('map', {
  dragging: false,
  keyboard: false,
  zoomControl: false,
  center: [100, 0],
  zoom: 2,
  minZoom: 2,
  maxZoom: 4,
  maxBounds: [
    [-85, -180],
    [85, 180]
  ],
  maxBoundsViscosity: 1.0
});

let geojsonLayer;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  noWrap: true
}).addTo(map);

fetch('world.geojson')
  .then(res => res.json())
  .then(geoData => {
    const geoLayer = L.geoJSON(geoData).addTo(map);
    map.fitBounds(geoLayer.getBounds());
  });

fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
  .then(response => response.json())
  .then(data => {
    geojsonLayer = L.geoJSON(data, {
      style: function (feature) {
        return {
          fillColor: 'lightgreen',
          color: 'green',
          weight: 1,
          fillOpacity: 0.6
        };
      },
      onEachFeature: function (feature, layer) {
        layer.bindTooltip(feature.properties.name, { sticky: true });
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
            geojsonLayer.resetStyle(e.target);
            e.target.closeTooltip();
          }
        });
      }
    }).addTo(map);
  })
  .catch(error => {
    console.error('GeoJSON 불러오기 실패:', error);
  });

