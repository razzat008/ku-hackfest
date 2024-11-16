import zipfile
import requests
import json
import time
import geopandas as gpd
import logging
import sys
import io

# Set up logging
logging.basicConfig(level=logging.INFO)

# Defining the API endpoint
BASE_API_URL = 'https://api-prod.raw-data.hotosm.org/v1'
FILENAME = 'My_Export.geojson'

# Payload for the API request
payload = {
    "outputType": "geojson",
    "fileName": "My_Export",
    "geometry": {
        "type": "Polygon",
        "coordinates": [
            [
                [
                    83.96919250488281,
                    28.194446860487773
                ],
                [
                    83.99751663208006,
                    28.194446860487773
                ],
                [
                    83.99751663208006,
                    28.214869548073377
                ],
                [
                    83.96919250488281,
                    28.214869548073377
                ],
                [
                    83.96919250488281,
                    28.194446860487773
                ]
            ]
        ]
    },
    "filters": {
        "tags": {
            "all_geometry": {
                "join_or": {
                    "building": ["yes"]
                }
            }
        },
    },
    "geometryType": [
        "point",
        "polygon"
    ]
}

headers = {'accept': "application/json", "Content-Type": "application/json"}


def make_request(url, method='POST', data=None):
    """Make a request to the given URL."""
    try:
        if method == 'POST':
            response = requests.post(url, data=json.dumps(
                data), headers=headers, timeout=10)
        else:
            response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logging.error(f"Request failed: {e}")
        return None


def download_and_extract_geojson(download_url):
    """Download the zip file, save it to disk, and extract the GeoJSON."""
    try:
        response = requests.get(download_url)
        response.raise_for_status()  # Check for HTTP errors

        # Save the ZIP file to disk
        zip_filename = 'My_Export.zip'
        with open(zip_filename, 'wb') as zip_file:
            zip_file.write(response.content)

        logging.info(f"Downloaded ZIP file saved as: {zip_filename}")

        # Extract the GeoJSON from the ZIP file
        with zipfile.ZipFile(io.BytesIO(response.content), 'r') as zip_ref:
            with zip_ref.open(FILENAME) as file:
                return json.loads(file.read())
    except Exception as e:
        logging.error(f"Failed to download or extract GeoJSON: {e}")
        return None


# Making call to the API to get boundary
task_response = make_request(f"{BASE_API_URL}/snapshot/", data=payload)

if task_response is None:
    logging.error("Failed to get task response.")
    sys.exit(1)

# Extracting the task tracking URL
task_track_url = task_response.get('track_link')
if not task_track_url:
    logging.error("No track link found in the response.")
    sys.exit(1)

stop_loop = False

# Polling for the task status
while not stop_loop:
    check_result = make_request(
        f"{BASE_API_URL}{task_track_url}", method='GET')

    if check_result is None:
        logging.error("Failed to check task status.")
        sys.exit(1)

    # Status will tell the current status of your task
    if check_result['status'] in ['SUCCESS', 'FAILED']:
        stop_loop = True

    time.sleep(1)  # Check each second

# Extract
if check_result['status'] == 'SUCCESS':

    result_data = check_result.get('result', {})

    download_url = result_data.get('download_url', 'Not Found')

    if download_url == 'Not Found':

        logging.error("Download URL not found in the result.")

        sys.exit(1)

    logging.info(f"Download URL: {download_url}")

    # Download and extract the GeoJSON

    my_export_geojson = download_and_extract_geojson(download_url)

    if my_export_geojson is None:

        logging.error("Failed to download or extract GeoJSON.")

        sys.exit(1)

    # Create a GeoDataFrame from the GeoJSON features

    df = gpd.GeoDataFrame.from_features(my_export_geojson['features'])

    logging.info("GeoDataFrame created successfully.")

    # Display the first two rows of the DataFrame

    print(df.head(2))

    # Plot the GeoDataFrame

    df.plot()

else:

    logging.error("Task failed with status: {}".format(check_result['status']))
