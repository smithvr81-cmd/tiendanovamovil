#!/usr/bin/env python3
"""Preparación segura de publicaciones desde Google Drive. No publica sin autorización."""
import os, json, sys
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES=["https://www.googleapis.com/auth/drive.readonly"]
def main():
    required=["DRIVE_SERVICE_ACCOUNT_JSON","SOCIAL_VIDEO_FOLDER_ID"]
    missing=[x for x in required if not os.getenv(x)]
    if missing:
        print("Configuración pendiente: "+", ".join(missing))
        return 0
    credentials=service_account.Credentials.from_service_account_info(
        json.loads(os.environ["DRIVE_SERVICE_ACCOUNT_JSON"]), scopes=SCOPES)
    drive=build("drive","v3",credentials=credentials,cache_discovery=False)
    folder=os.environ["SOCIAL_VIDEO_FOLDER_ID"].replace("'","\\'")
    query=f"'{folder}' in parents and trashed = false and mimeType contains 'video/'"
    result=drive.files().list(q=query,fields="nextPageToken,files(id,name,mimeType,createdTime,description)",orderBy="createdTime desc",page_size=20).execute()
    videos=result.get("files",[])
    print(json.dumps({"videos_encontrados":len(videos),"archivos":[{"id":v["id"],"name":v["name"]} for v in videos]},ensure_ascii=False))
    print("Modo seguro: no se publica hasta configurar OAuth y validación por plataforma.")
    return 0
if __name__=="__main__": sys.exit(main())
