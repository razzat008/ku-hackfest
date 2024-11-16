import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import XYZ from 'ol/source/XYZ';
import Feature from 'ol/Feature';
import { Polygon } from 'ol/geom';
import { Style, Fill } from 'ol/style';
import RightBar from './RightBar';

const MapComponent = () => {
  const mapRef = useRef(null);
  const [latitude, setLatitude] = useState(27.7172);
  const [longitude, setLongitude] = useState(85.3240);
  const [currentZoom, setCurrentZoom] = useState(15);
  const [bounds, setBounds] = useState(null);
  const mapViewRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [selectedLayer, setSelectedLayer] = useState('osm');
  const [showOverlay, setShowOverlay] = useState(false);
  const overlayLayerRef = useRef(null);

  const osmLayer = useRef(new TileLayer({
    source: new OSM(),
    visible: true,
  }));

  const hospitalLayer= useRef(
    new VectorLayer({
      source: new VectorSource({
        format: new GeoJSON(),
        url: "../hospital.geojson",
      }),
    })
  );

  const schoolLayer = useRef(
    new VectorLayer({
      source: new VectorSource({
        format: new GeoJSON(),
        url: "../school.geojson",
      }),
    })
  );

  const xyzLayer = useRef(
    new TileLayer({
      source: new XYZ({
        url: 'https://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}',
      }),
      visible: false,
    })
  );

  const getCurrentMapBounds = () => {
    if (mapInstanceRef.current) {
      const view = mapInstanceRef.current.getView();
      const extent = view.calculateExtent(mapInstanceRef.current.getSize());
      const bottomLeft = toLonLat([extent[0], extent[1]]);
      const topRight = toLonLat([extent[2], extent[3]]);

      const bounds = {
        southWest: {
          lat: bottomLeft[1],
          lng: bottomLeft[0],
        },
        northEast: {
          lat: topRight[1],
          lng: topRight[0],
        },
        zoom: view.getZoom(),
      };

      setBounds(bounds);
      return bounds;
    }
    return null;
  };

const handleBBoxClick = () => {
  const currentBounds = getCurrentMapBounds();
  if (currentBounds) {
    const centerLat = (currentBounds.southWest.lat + currentBounds.northEast.lat) / 2;
    const centerLng = (currentBounds.southWest.lng + currentBounds.northEast.lng) / 2;

    setLatitude(centerLat);
    setLongitude(centerLng);

    console.log('Current Map Bounds:', {
      'Southwest Corner': `${currentBounds.southWest.lat.toFixed(4)}, ${currentBounds.southWest.lng.toFixed(4)}`,
      'Southeast Corner': `${currentBounds.southWest.lat.toFixed(4)}, ${currentBounds.northEast.lng.toFixed(4)}`,
      'Northeast Corner': `${currentBounds.northEast.lat.toFixed(4)}, ${currentBounds.northEast.lng.toFixed(4)}`,
      'Northwest Corner': `${currentBounds.northEast.lat.toFixed(4)}, ${currentBounds.southWest.lng.toFixed(4)}`,
      'Zoom Level': currentBounds.zoom.toFixed(2),
    });
  }
};

  const toggleOverlay = () => {
    setShowOverlay((prevState) => !prevState);
  };

const updateOverlay = () => {
  if (mapInstanceRef.current && overlayLayerRef.current) {
    const center = fromLonLat([longitude, latitude]);
    const boxSize = 1000; // Adjust size in map projection units (e.g., meters for Web Mercator)

    if (showOverlay) {
      const boxCoordinates = [
        [center[0] - boxSize, center[1] - boxSize],
        [center[0] + boxSize, center[1] - boxSize],
        [center[0] + boxSize, center[1] + boxSize],
        [center[0] - boxSize, center[1] + boxSize],
        [center[0] - boxSize, center[1] - boxSize],
      ];

      // Create a new polygon feature
      const polygonFeature = new Feature({
        geometry: new Polygon([boxCoordinates]),
      });

      // Clear the overlay layer source and add the new feature
      const overlaySource = overlayLayerRef.current.getSource();
      overlaySource.clear();
      overlaySource.addFeature(polygonFeature);
    } else {
      overlayLayerRef.current.getSource().clear();
    }
  }
};

  useEffect(() => {
    const kathmanduCoordinates = fromLonLat([longitude, latitude]);

    overlayLayerRef.current = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 0, 0, 0.3)',
        }),
      }),
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        hospitalLayer.current,
        schoolLayer.current,
        osmLayer.current,
        xyzLayer.current,
        overlayLayerRef.current,
      ],
      view: new View({
        center: kathmanduCoordinates,
        zoom: currentZoom,
      }),
    });

    mapViewRef.current = map.getView();
    mapInstanceRef.current = map;

    map.on('moveend', () => {
      const view = map.getView();
      setCurrentZoom(view.getZoom());
      getCurrentMapBounds();
    });

    return () => map.setTarget(null);
  }, []);

useEffect(() => {
  updateOverlay();
}, [latitude, longitude, showOverlay]);

  const handleLayerChange = (event) => {
    const selected = event.target.value;
    setSelectedLayer(selected);

    if (selected === 'osm') {
      osmLayer.current.setVisible(true);
      xyzLayer.current.setVisible(false);
    } else if (selected === 'xyz') {
      osmLayer.current.setVisible(false);
      xyzLayer.current.setVisible(true);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ position: 'relative', width: '75vw', height: '100vh' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

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

        <div style={{ position: 'absolute', bottom: '10px', left: '10px', zIndex: 1, color: '#fff' }}>
          <label style={{ marginRight: '8px' }}>
            Latitude:
            <input
              type="number"
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value))}
              style={{ marginLeft: '5px', padding: '5px', width: '100px' }}
            />
          </label>
          <label style={{ marginRight: '8px' }}>
            Longitude:
            <input
              type="number"
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value))}
              style={{ marginLeft: '5px', padding: '5px', width: '100px' }}
            />
          </label>
        </div>
      </div>

      <RightBar
        onBBoxClick={handleBBoxClick}
        currentZoom={currentZoom}
        bounds={bounds}
        onToggleOverlay={toggleOverlay}
        showOverlay={showOverlay}
      />
    </div>
  );
};

export default MapComponent;
