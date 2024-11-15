import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css'; // OpenLayers CSS for styling
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import HeatmapLayer from 'ol/layer/Heatmap';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import GeoJSON from 'ol/format/GeoJSON';

import XYZ from 'ol/source/XYZ';

const MapComponent = () => {
  const mapRef = useRef(null);
  const [latitude, setLatitude] = useState(27.7172); // Default: Kathmandu
  const [longitude, setLongitude] = useState(85.3240); // Default: Kathmandu
  const [isGradientVisible, setIsGradientVisible] = useState(false);
  const mapViewRef = useRef(null);
  const [selectedLayer, setSelectedLayer] = useState('osm'); // Layer selection state

  const osmLayer = useRef(
    new TileLayer({
      source: new OSM(),
      visible: true, // Default visible layer
    })
  );

  const xyzLayer = useRef(
    new TileLayer({
      source: new XYZ({
        url: 'https://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', // Google Maps XYZ tiles
      }),
      visible: false, // Initially hidden
    })
  );

  useEffect(() => {
    const kathmanduCoordinates = fromLonLat([longitude, latitude]);
    
    const points = [
      [85.3240, 27.7172],
      [85.3213, 27.7140],
      [85.3280, 27.7200],
      [85.3267, 27.7152],
      [85.3333, 27.7195],
      [85.3299, 27.7184],
    ];

    // Convert points to features for the VectorSource
    const features = points.map(([lon, lat]) => {
      return new Feature({
        geometry: new Point(fromLonLat([lon, lat])),
      });
    });

    // Create Vector Source and Heatmap Layer
    const vectorSource = new VectorSource({
      features: features,
    });

    const heatmapLayer = new HeatmapLayer({
      source: vectorSource,
      blur: 20, // Amount of blur on each point (adjust as needed)
      radius: 10, // Radius of influence for each point (adjust as needed)
      opacity: 0.8,
    });


    // Initialize OpenLayers map
    const map = new Map({
      target: mapRef.current,
      layers: [osmLayer.current, xyzLayer.current], // Add both layers
      view: new View({
        center: kathmanduCoordinates,
        zoom: 15, // Initial zoom level
      }),
    });

    mapViewRef.current = map.getView();

    // Clean up on component unmount
    return () => map.setTarget(null);
  }, []);

  // Update map center when latitude or longitude changes
  useEffect(() => {
    const newCenter = fromLonLat([longitude, latitude]);
    mapViewRef.current?.setCenter(newCenter);
  }, [latitude, longitude]);

  // Toggle the gradient overlay
  const toggleGradient = () => {
    setIsGradientVisible(!isGradientVisible);
  };

  // Handle layer switch
  const handleLayerChange = (event) => {
    const selected = event.target.value;
    setSelectedLayer(selected);

    // Update layer visibility
    if (selected === 'osm') {
      osmLayer.current.setVisible(true);
      xyzLayer.current.setVisible(false);
    } else if (selected === 'xyz') {
      osmLayer.current.setVisible(false);
      xyzLayer.current.setVisible(true);
    }
  };

  return (
    <div style={{ position: 'relative', width: '75vw', height: '100vh', margin: '0 auto' }}>
      {/* Map container */}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Gradient overlay over a specific area */}
      {isGradientVisible && (
        <div
          style={{
            position: 'absolute',
            top: '20%', // Adjust as needed to position the rectangle
            left: '20%', // Adjust as needed for horizontal position
            width: '30%', // Define overlay width
            height: '30%', // Define overlay height
            background: 'linear-gradient(to bottom right, rgba(255, 126, 95, 0.5), rgba(254, 180, 123, 0.5))',
            borderRadius: '10px', // Optional: for rounded corners
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Checkbox button for gradient */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1, color: '#fff' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" checked={isGradientVisible} onChange={toggleGradient} />
          Gradient Overlay
        </label>
      </div>

      {/* Latitude and Longitude Inputs */}
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', zIndex: 1, color: '#fff' }}>
        <label style={{ marginRight: '8px', color: '#fff' }}>
          Latitude:
          <input
            type="number"
            value={latitude}
            onChange={(e) => setLatitude(parseFloat(e.target.value))}
            style={{ marginLeft: '5px', padding: '5px', width: '100px' }}
          />
        </label>
        <label style={{ marginRight: '8px', color: '#fff' }}>
          Longitude:
          <input
            type="number"
            value={longitude}
            onChange={(e) => setLongitude(parseFloat(e.target.value))}
            style={{ marginLeft: '5px', padding: '5px', width: '100px' }}
          />
        </label>
      </div>

      {/* Layer Switcher */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1, color: '#fff' }}>
        <label style={{ marginRight: '8px', color: '#fff' }}>
          Layer:
          <select
            value={selectedLayer}
            onChange={handleLayerChange}
            style={{ marginLeft: '5px', padding: '5px' }}
          >
            <option value="osm">OpenStreetMap</option>
            <option value="xyz">Satellite Image</option>
          </select>
        </label>
      </div>
    </div>
  );
};

export default MapComponent;
