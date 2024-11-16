from flask import Flask, request, jsonify
import requests
import logging
import json

# Initialize Flask app
app = Flask(__name__)

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

base_api_url = 'https://api-prod.raw-data.hotosm.org/v1'
headers = {'Accept': "application/json", "Content-Type": "application/json"}


def create_join_or_payload(query_type, values):
    """
    Creates the join_or part of the payload based on query type
    """
    if not query_type or not values:
        return {"buildings": [" "]}  # default case

    # Convert string of values to list if needed
    if isinstance(values, str):
        values = [v.strip() for v in values.split(',')]

    query_mapping = {
        "waterways": "waterways",
        "building": "buildings",
        "amenity": "amenities",
        "healthcare": "healthcare",
        "emergency": "emergency",
        "landuse": "landuse",
        "leisure": "leisure"  # Added new key-value pair from the image
    }

    # Use the mapped key or the original query_type if no mapping exists
    payload_key = query_mapping.get(query_type, query_type)
    return {payload_key: values}


@app.route('/api/', methods=['GET'])
def get_geo_data():
    try:
        # Extract query parameters
        min_lon = float(request.args.get('min_lon'))
        min_lat = float(request.args.get('min_lat'))
        max_lon = float(request.args.get('max_lon'))
        max_lat = float(request.args.get('max_lat'))

        # Get query type and values from URL parameters
        # e.g., 'waterways', 'building', 'amenity'
        query_type = request.args.get('type')
        # e.g., 'river' or 'hospital,clinic,pharmacy'
        query_values = request.args.get('values')

        logger.debug(f"Query type: {query_type}, values: {query_values}")
        logger.debug(f"Bounding box: {min_lon}, {
                     min_lat}, {max_lon}, {max_lat}")

        payload = {
            "outputType": "geojson",
            "filename": "my_export",
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
                        "join_or": create_join_or_payload(query_type, query_values)
                    }
                }
            },
            "geometryType": ["point", "polygon"]
        }

        task_response = requests.post(
            url=f"{base_api_url}/snapshot/plain/",
            data=json.dumps(payload),
            headers=headers
        )

        result = task_response.json()
        logger.info("Response received from external API")
        return jsonify(result)

    except requests.exceptions.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        return jsonify({'error': 'Request failed', 'details': str(e)}), 400
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
