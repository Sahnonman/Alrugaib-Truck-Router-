import streamlit as st
import requests
import folium
from streamlit_folium import st_folium

# تحميل الأسرار من .streamlit/secrets.toml
MAPBOX_TOKEN = st.secrets["MAPBOX_TOKEN"]

st.set_page_config(page_title="Alrugaib Routing Streamlit", layout="wide")
st.title("Alrugaib Routing (Streamlit)")

# --- نموذج الإدخال ---
with st.sidebar.form(key="input_form"):
    st.subheader("بيانات الرحلة")
    origin = st.text_input("عنوان الانطلاق", "الرياض، حي الملك فهد")
    destination = st.text_input("عنوان الوجهة", "جدة، المنطقة الصناعية")
    num_stops = st.number_input("عدد نقاط التوقف الوسيطة", min_value=0, max_value=5, value=0)
    stops = []
    for i in range(num_stops):
        loc = st.text_input(f"نقطة توقف {i+1}", key=f"stop_loc_{i}")
        stops.append(loc)
    fuel_price = st.number_input("سعر الوقود (ر.س./لتر)", value=2.33)
    fuel_eff = st.number_input("كفاءة الوقود (كم/لتر)", value=3.5)
    submitted = st.form_submit_button("احسب المسار")

# --- دوال المساعدة ---
def geocode(address: str):
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{requests.utils.requote_uri(address)}.json"
    params = {"access_token": MAPBOX_TOKEN, "limit": 1}
    r = requests.get(url, params=params)
    r.raise_for_status()
    return r.json()["features"][0]["center"]  # [lng, lat]

if submitted:
    try:
        origin_coords = geocode(origin)
        dest_coords = geocode(destination)
        stops_coords = [geocode(s) for s in stops]

        coords_list = [origin_coords] + stops_coords + [dest_coords]
        coord_str = ";".join([f"{lng},{lat}" for lng, lat in coords_list])

        # استدعاء Directions API
        url = f"https://api.mapbox.com/directions/v5/mapbox/driving/{coord_str}"
        params = {"access_token": MAPBOX_TOKEN, "geometries": "geojson", "overview": "full"}
        resp = requests.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        route = data["routes"][0]["geometry"]

        # احسب المسافة وتكلفة الوقود
        distance_km = data["routes"][0]["distance"] / 1000
        fuel_cost = distance_km / fuel_eff * fuel_price

        st.sidebar.markdown(f"**المسافة:** {distance_km:.1f} كم")
        st.sidebar.markdown(f"**تكلفة الوقود:** {fuel_cost:.2f} ر.س.")

        # عرض الخريطة
        m = folium.Map(location=[origin_coords[1], origin_coords[0]], zoom_start=6)
        folium.GeoJson(route, name="route").add_to(m)
        for idx, (lng, lat) in enumerate(coords_list):
            folium.Marker([lat, lng], tooltip=["A"] + [str(i+1) for i in range(len(stops))] + ["B"][idx]).add_to(m)
        st_folium(m, width=700, height=500)
    except Exception as e:
        st.error(f"حدث خطأ: {e}")
else:
    st.info("يرجى ملء البيانات في الشريط الجانبي والنقر على 'احسب المسار'")
