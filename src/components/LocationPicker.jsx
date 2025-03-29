import React, { useEffect, useRef, useId } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import the images directly
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl
});

const LocationPicker = ({ onLocationSelect, initialPosition = [0, 0], initialZoom = 2 }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapContainerRef = useRef(null);
  const uniqueId = useId();
  const mapId = `map-${uniqueId}`;

  useEffect(() => {
    // Initialize map only once
    if (!mapRef.current && mapContainerRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(initialPosition, initialZoom);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Add initial marker if position is provided
      if (initialPosition && initialPosition[0] !== 0 && initialPosition[1] !== 0) {
        markerRef.current = L.marker(initialPosition).addTo(mapRef.current);
      }

      // Add click handler
      mapRef.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.remove();
        }
        markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
        if (onLocationSelect) {
          onLocationSelect({ lat, lng });
        }
      });
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.off(); // Remove all event listeners
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onLocationSelect, initialPosition, initialZoom]);

  return (
    <div className="location-picker">
      <div 
        id={mapId}
        ref={mapContainerRef}
        style={{ height: '400px', width: '100%', borderRadius: '8px' }}
      />
    </div>
  );
};

export default LocationPicker;