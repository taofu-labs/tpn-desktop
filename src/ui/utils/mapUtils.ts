import L from 'leaflet';

export const serverIcon = L.divIcon({
  className: 'vpn-marker',
  html: '<div class="dot"></div>',
  iconSize: [10, 10],
});

export const connectedIcon = L.divIcon({
  className: 'vpn-marker-connected',
  html: '<div class="dot-connected"></div>',
  iconSize: [22, 22],
}); 