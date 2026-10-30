"""Subida manual controlada de un video específico de Drive a YouTube.
No se ejecuta con cron; evita publicaciones accidentales.
"""
import os, json, sys, tempfile
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

def main():
    if os.getenv("CONFIRM_PUBLISH") != "PUBLICAR":
        print("Publicación desactivada: se requiere confirmación explícita.")
        return
    required = ["DRIVE_SERVICE_ACCOUNT_JSON", "YOUTUBE_CLIENT_ID",
                "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "DRIVE_VIDEO_ID"]
    missing = [key for key in required if not os.getenv(key)]
    if missing:
        raise SystemExit("Faltan configuraciones: " + ", ".join(missing))
    drive_credentials = service_account.Credentials.from_service_account_info(
        json.loads(os.environ["DRIVE_SERVICE_ACCOUNT_JSON"]),
        scopes=["https://www.googleapis.com/auth/drive.readonly"])
    drive = build("drive", "v3", credentials=drive_credentials, cache_discovery=False)
    file_id = os.environ["DRIVE_VIDEO_ID"]
    metadata = drive.files().get(fileId=file_id, fields="id,name,mimeType,size").execute()
    if not metadata["mimeType"].startswith("video/"):
        raise SystemExit("El archivo no es un video.")
    from google.auth.transport.requests import Request
    yt_credentials = Credentials(
        token=None,
        refresh_token=os.environ["YOUTUBE_REFRESH_TOKEN"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["YOUTUBE_CLIENT_ID"],
        client_secret=os.environ["YOUTUBE_CLIENT_SECRET"],
        scopes=["https://www.googleapis.com/auth/youtube.upload"])
    yt_credentials.refresh(Request())
    youtube = build("youtube", "v3", credentials=yt_credentials, cache_discovery=False)
    import io
    from googleapiclient.http import MediaIoBaseDownload
    with tempfile.NamedTemporaryFile(suffix=".mp4") as tmp:
        request = drive.files().get_media(fileId=file_id)
        downloader = MediaIoBaseDownload(tmp, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()
        tmp.flush()
        title = os.getenv("VIDEO_TITLE") or metadata["name"].rsplit(".", 1)[0].replace("_", " ")
        description = os.getenv("VIDEO_DESCRIPTION") or (
            "Tienda Nova Móvil | Celulares y envíos a provincias. "
            "Consulta por WhatsApp: https://wa.me/51935748390 #Shorts #TiendaNovaMovil")
        result = youtube.videos().insert(
            part="snippet,status",
            body={"snippet":{"title":title[:100],"description":description},
                  "status":{"privacyStatus":"private"}},
            media_body=MediaFileUpload(tmp.name, mimetype=metadata["mimeType"], resumable=True)
        ).execute()
        print("Video subido como PRIVADO. ID:", result["id"])

if __name__ == "__main__":
    main()
