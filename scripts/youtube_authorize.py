"""Obtener OAuth de YouTube en la computadora del propietario, sin compartir contraseñas.
Requiere: pip install google-auth-oauthlib
Ejecutar: python scripts/youtube_authorize.py client_secret.json
"""
import sys
from google_auth_oauthlib.flow import InstalledAppFlow

if len(sys.argv) != 2:
    raise SystemExit("Uso: python scripts/youtube_authorize.py client_secret.json")
flow = InstalledAppFlow.from_client_secrets_file(
    sys.argv[1], scopes=["https://www.googleapis.com/auth/youtube.upload"]
)
creds = flow.run_local_server(port=0, open_browser=True, access_type="offline", prompt="consent")
print("Guarda estos valores SOLO en GitHub Actions Secrets:")
print("YOUTUBE_CLIENT_ID:", creds.client_id)
print("YOUTUBE_CLIENT_SECRET:", creds.client_secret)
print("YOUTUBE_REFRESH_TOKEN:", creds.refresh_token or "NO GENERADO; revoca acceso y repite")
