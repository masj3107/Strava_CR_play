import json
import requests
import re
import time

# Ange din Strava OAuth-token
ACCESS_TOKEN = "6b524079a9b6f710c58801537c302e8d5e6ee499"
BASE_URL = "https://www.strava.com/api/v3"

def get_segment_details(segment_id):
    """
    Hämtar detaljer för ett segment från Strava API.
    """
    url = f"{BASE_URL}/segments/{segment_id}"
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}"
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Fel vid hämtning av segment {segment_id}: {response.status_code} {response.text}")
        return None

def extract_segment_id(link):
    """
    Extraherar segment-ID från en Strava-länk, t.ex. 'https://www.strava.com/segments/5330073'
    """
    match = re.search(r'/segments/(\d+)', link)
    if match:
        return match.group(1)
    else:
        return None

def update_segments(segments):
    """
    Går igenom varje segment, hämtar detaljer från Strava och uppdaterar de saknade fälten.
    """
    for segment in segments:
        segment_id = extract_segment_id(segment["link"])
        if not segment_id:
            print(f"Kunde inte extrahera segment-ID från {segment['link']}")
            continue

        details = get_segment_details(segment_id)
        if details:
            # Fyll i polyline om den finns i details["map"]
            if "map" in details and "polyline" in details["map"]:
                segment["polyline"] = details["map"]["polyline"]
            else:
                segment["polyline"] = ""

            # För demonstration antas att effort_count och athlete_count returneras av API:t.
            # Om dessa fält inte finns, lämnas de som tomma strängar.
            segment["effort_count"] = details.get("effort_count", "")
            segment["athlete_count"] = details.get("athlete_count", "")

            print(f"Uppdaterat segment {segment['name']} (ID: {segment_id})")

        # Vänta lite för att undvika att överskrida rate limits
        time.sleep(1)
    return segments

def main():
    # Läs in din ursprungliga JSON-fil med segment (exempelvis "segments.json")
    with open("segments_ca.json", "r", encoding="utf-8") as f:
        segments = json.load(f)

    updated_segments = update_segments(segments)

    # Spara den uppdaterade listan till en ny fil
    with open("segments_updated.json", "w", encoding="utf-8") as f:
        json.dump(updated_segments, f, ensure_ascii=False, indent=2)
    print("Uppdaterade segment sparade till segments_updated.json")

if __name__ == "__main__":
    main()
