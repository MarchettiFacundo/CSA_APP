import urllib.request
import json

url_vehiculos = "http://localhost:8000/api/vehiculos/"
req_v = urllib.request.Request(url_vehiculos)
with urllib.request.urlopen(req_v) as response:
    vehiculos = json.loads(response.read().decode('utf-8'))

if not vehiculos:
    print("No vehiculos found!")
    exit(1)

patente = vehiculos[0]["patente"]

url = "http://localhost:8000/api/ordenes/"
data = {
    "descripcion": "Problema con motor",
    "vehiculo_patente": patente,
    "servicios": []
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        body = response.read().decode('utf-8')
        print("Status:", response.status)
        print("Body:", body)
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Error Body:", json.loads(e.read().decode('utf-8'))['detail'])
except Exception as e:
    print("Error:", e)
