import geopandas as gpd
import matplotlib.pyplot as plt
import json
import requests
import contextily as ctx  # For OSM basemap

BASE_API_URL = 'https://api-prod.raw-data.hotosm.org/v1'
headers = {'accept': "application/json", "Content-Type": "application/json"}

aoi_coordinates = [
    [
        [85.324, 27.7172],
        [85.324, 27.7272],
        [85.334, 27.7272],
        [85.334, 27.7172],
        [85.324, 27.7172]
    ]
]

payload_template = {
    "geometry": {
        "type": "Polygon",
        "coordinates": aoi_coordinates
    },
    "filters": {
        "tags": {
            "all_geometry": {
                "join_or": {
                    "amenity": ["hospital", "clinic", "doctors", "pharmacy", "police", "fire_station"],
                    "emergency": ["yes"],
                    "highway": ["bus_stop"],
                    "amenity": ["school", "kindergarten", "university"],
                    "shop": ["supermarket", "grocery", "bakery", "convenience"],
                    "amenity": ["bank", "atm"]
                }
            }
        }
    },
    "geometryType": ["point", "polygon"]
}

# Request data from the API
task_response = requests.post(
    url=f"{BASE_API_URL}/snapshot/plain/",
    data=json.dumps(payload_template), headers=headers)
task_response.raise_for_status()

result = task_response.json()

# Debug: Print the result
print("API Response:")
print(json.dumps(result, indent=2))

# Parse features
point_features = []
polygon_features = []

if 'features' in result:
    for feature in result['features']:
        if feature['geometry']['type'] == 'Point':
            point_features.append(feature)
        elif feature['geometry']['type'] == 'Polygon':
            polygon_features.append(feature)

# Save features to GeoJSON
if point_features:
    point_gdf = gpd.GeoDataFrame.from_features(point_features, crs="EPSG:4326")
    point_gdf.to_file('points.geojson', driver='GeoJSON')
    print(f"Point features saved to 'points.geojson' ({len(point_features)} features).")

if polygon_features:
    polygon_gdf = gpd.GeoDataFrame.from_features(polygon_features, crs="EPSG:4326")
    polygon_gdf.to_file('polygons.geojson', driver='GeoJSON')
    print(f"Polygon features saved to 'polygons.geojson' ({len(polygon_features)} features).")

# Load and visualize the GeoJSON files
fig, ax = plt.subplots(figsize=(12, 12))

if point_features:
    points_gdf = gpd.read_file('points.geojson')
    points_gdf = points_gdf.to_crs(epsg=3857)  # Convert to Web Mercator for basemap compatibility
    points_gdf.plot(ax=ax, color='red', marker='o', label="Points")

if polygon_features:
    polygons_gdf = gpd.read_file('polygons.geojson')
    polygons_gdf = polygons_gdf.to_crs(epsg=3857)  # Convert to Web Mercator for basemap compatibility
    polygons_gdf.plot(ax=ax, color='lightblue', edgecolor='black', alpha=0.5, label="Polygons")

# Add OSM basemap
ctx.add_basemap(ax, source=ctx.providers.OpenStreetMap.Mapnik)

# Add legend and title
plt.legend()
plt.title("Visualization of Points and Polygons with OSM Basemap", fontsize=15)

# Show the plot
plt.show()