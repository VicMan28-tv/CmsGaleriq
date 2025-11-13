from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def root():
    return {"ok": True, "service": "Galeriq CMS API"}
