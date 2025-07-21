import L from 'leaflet';

export const serverIcon = L.divIcon({
  className: 'vpn-marker',
  html: '<div class="dot"></div>',
  iconSize: [10, 10],
});

export const selectedIcon = L.divIcon({
  className: 'vpn-marker-selected',
  html: '<div class="dot-selected"></div>',
  iconSize: [12, 12],
});

export const connectedIcon = L.divIcon({
  className: 'vpn-marker-connected',
  html: '<div class="dot-connected"></div>',
  iconSize: [22, 22],
}); 