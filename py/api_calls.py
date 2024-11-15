import geopandas as gpd
import matplotlib.pyplot as plt
import json
import requests

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

task_response = requests.post(
    url=f"{BASE_API_URL}/snapshot/plain/",
    data=json.dumps(payload_template), headers=headers)
task_response.raise_for_status()

result = task_response.json()

point_features = []
polygon_features = []

if 'features' in result:
    for feature in result['features']:
        if feature['geometry']['type'] == 'Point':
            point_features.append(feature)
        elif feature['geometry']['type'] == 'Polygon':
            polygon_features.append(feature)

if point_features:
    point_gdf = gpd.GeoDataFrame.from_features(point_features)
    point_gdf.to_file('points.geojson', driver='GeoJSON')
    print("Point features saved to 'points.geojson'")

if polygon_features:
    polygon_gdf = gpd.GeoDataFrame.from_features(polygon_features)
    polygon_gdf.to_file('polygons.geojson', driver='GeoJSON')
    print("Polygon features saved to 'polygons.geojson'")
