# backend/app/routes/images.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import shutil
import uuid
from typing import List

from app.core.db import get_db

router = APIRouter(prefix="/images", tags=["images"])

# Directorio para almacenar imágenes
IMAGES_DIR = "uploads/images"
os.makedirs(IMAGES_DIR, exist_ok=True)

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Sube una imagen al servidor"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
    
    # Generar nombre único para la imagen
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(IMAGES_DIR, unique_filename)
    
    # Guardar la imagen
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {
        "filename": unique_filename,
        "url": f"/static/images/{unique_filename}"
    }

@router.get("/list")
async def list_images():
    """Lista todas las imágenes disponibles"""
    images = []
    for filename in os.listdir(IMAGES_DIR):
        if os.path.isfile(os.path.join(IMAGES_DIR, filename)):
            images.append({
                "filename": filename,
                "url": f"/static/images/{filename}"
            })
    return images

@router.delete("/{filename}")
async def delete_image(filename: str):
    """Elimina una imagen del servidor"""
    file_path = os.path.join(IMAGES_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    
    os.remove(file_path)
    return {"message": "Imagen eliminada correctamente"}