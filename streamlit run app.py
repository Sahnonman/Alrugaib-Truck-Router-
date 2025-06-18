import streamlit as st
import requests
import folium
from streamlit_folium import st_folium

# --- Configuration ---
MAPBOX_TOKEN = st.secrets["MAPBOX_TOKEN"]  # Set in .streamlit/secrets.toml

st.set_page_config(page_title="Alrugaib Routing Streamlit", layout="wide")

st.title("Alrugaib Routing (Streamlit)")

# --- Input Form ---
with st.sidebar.form(key="input_form"):
    st.subheader("بيانات الرحلة")
    origin = st.text_input("عنوان الانطلاق", "الرياض، حي الملك فهد")
    destination = st.text_input("عنوان الوجهة", "جدة، المنطقة الصناعية")
    num_stops = st.number_input("عدد نقاط التوقف الوسيطة", min_value=0, max_value=5, value=0)
    stops = []
    for i in range(num_stops):
        loc = st.text_input(f"نقطة توقف {i+1}", key=f"stop_loc_{i}")
        stops.append(loc)
    vehicle_type = st.selectbox("نوع المركبة", ["trailer", "5-axle-trailer"])
    max_load = st.number_input("سعة الحمولة القصوى (طن)", value=27)
    rest_hours = st.number_input("ساعات الراحة الإلزامية للسائق", min_value=0, max_value=24, value=9)
    tolls = st.number_input("رسوم الطرق (ر.س.)", value=0)
    fuel_price = st.number_input("سعر الوقود (ر.س./لتر)", value=2.33)
    fuel_eff = st.number_input("كفاءة الوقود (كم/لتر)", value=3.5)
    avoid_ferries = st.checkbox("تجنب العبّارات")
    avoid_tunnels = st.checkbox("تجنب الأنفاق")
    submitted = st.form_submit_button("احسب المسار")

# --- Helper Functions ---
def geocode(address: str):
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{requests.utils.requote_uri(address)}.json"
    params = {"access_token": MAPBOX_TOKEN, "limit": 1}
    r = requests.get(url, params=params)
    r.raise_for_status()
    coords = r.json()["features"][0]["center"]
    return coords  # [lng, lat]

# Build coordinates string
if submitted:
    try:
        origin_coords = geocode(origin)
        dest_coords = geocode(destination)
        stops_coords = [geocode(s) for s in stops]

        coords_list = [origin_coords] + stops_coords + [dest_coords]
        coord_str = ";".join([f"{lng},{lat}" for lng, lat in coords_list])

        # Directions API
        url = f"https://api.mapbox.com/directions/v5/mapbox/driving/{coord_str}"
        params = {
            "access_token": MAPBOX_TOKEN,
            "geometries": "geojson",
            "overview": "full"
        }
        resp = requests.get(url, params=params)
        resp.raise_for_status()
        route = resp.json()["routes"][0]["geometry"]

        # Calculate distance & fuel cost
        distance_km = resp.json()["routes"][0]["distance"] / 1000
        fuel_cost = distance_km / fuel_eff * fuel_price

        st.sidebar.markdown(f"**المسافة:** {distance_km:.1f} كم")
        st.sidebar.markdown(f"**تكلفة الوقود:** {fuel_cost:.2f} ر.س.")

        # Display map
        m = folium.Map(location=[origin_coords[1], origin_coords[0]], zoom_start=6)
        folium.GeoJson(route, name="route").add_to(m)
        for idx, (lng, lat) in enumerate(coords_list):
            folium.Marker([lat, lng], tooltip=['A', *range(1, len(stops_coords)+1), 'B'][idx]).add_to(m)
        st_folium(m, width=700, height=500)

    except Exception as e:
        st.error(f"حدث خطأ: {e}")
else:
    st.info("يرجى ملء البيانات في الشريط الجانبي والنقر على 'احسب المسار'")
