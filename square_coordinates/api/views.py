import json
import os
import requests
import geopandas as gpd
from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from django.conf import settings
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

BASE_API_URL = 'https://api-prod.raw-data.hotosm.org/v1'
headers = {'accept': "application/json", "Content-Type": "application/json"}


@api_view(['POST'])
def get_geo_data(request):
    try:
        logger.info("Received request for geo data")
        data = json.loads(request.body)
        min_lon = float(data.get('min_lon'))
        min_lat = float(data.get('min_lat'))
        max_lon = float(data.get('max_lon'))
        max_lat = float(data.get('max_lat'))

        logger.debug(f"Bounding box: {min_lon}, {
                     min_lat}, {max_lon}, {max_lat}")

        payload_template = {
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [min_lon, min_lat],
                    [max_lon, min_lat],
                    [max_lon, max_lat],
                    [min_lon, max_lat],
                    [min_lon, min_lat]
                ]]
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

        logger.info("Sending request to external API")
        task_response = requests.post(
            url=f"{BASE_API_URL}/snapshot/plain/",
            data=json.dumps(payload_template),
            headers=headers
        )
        task_response.raise_for_status()

        logger.info("Received response from external API")
        result = task_response.json()

        point_features = []
        polygon_features = []

        if 'features' in result:
            for feature in result['features']:
                if feature['geometry']['type'] == 'Point':
                    point_features.append(feature)
                elif feature['geometry']['type'] == 'Polygon':
                    polygon_features.append(feature)

        logger.info(f"Found {len(point_features)} point features and {
                    len(polygon_features)} polygon features")

        # Save point features to GeoJSON
        if point_features:
            point_gdf = gpd.GeoDataFrame.from_features(point_features)
            points_file_path = os.path.join(
                settings.BASE_DIR, 'points.geojson')
            point_gdf.to_file(points_file_path, driver='GeoJSON')
            logger.info(f"Saved point features to {points_file_path}")

        # Save polygon features to GeoJSON
        if polygon_features:
            polygon_gdf = gpd.GeoDataFrame.from_features(polygon_features)
            polygons_file_path = os.path.join(
                settings.BASE_DIR, 'polygons.geojson')
            polygon_gdf.to_file(polygons_file_path, driver='GeoJSON')
            logger.info(f"Saved polygon features to {polygons_file_path}")

        response_data = {
            'points': point_gdf.to_json() if point_features else None,
            'polygons': polygon_gdf.to_json() if polygon_features else None,
            'points_file': 'points.geojson' if point_features else None,
            'polygons_file': 'polygons.geojson' if polygon_features else None
        }

        logger.info("Sending response back to client")
        return JsonResponse(response_data)

    except requests.exceptions.RequestException as e:
        logger.error(f"Error making request to external API: {str(e)}")
        return JsonResponse({"error": f"Error making request to external API: {str(e)}"}, status=500)
    except json.JSONDecodeError as e:
        logger.error(f"Error decoding JSON: {str(e)}")
        return JsonResponse({"error": f"Error decoding JSON: {str(e)}"}, status=400)
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)


def index(request):
    return render(request, 'index.html')
