from fastapi import Header, HTTPException, status, Depends
from app.core.security import decode_access_token


def get_role(x_role: str | None = Header(default=None)):
    if x_role not in ("admin", "employee"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid X-Role header (use 'admin' or 'employee').",
        )
    return x_role

def require_admin(role: str = Depends(get_role)):
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins only",
        )
    return role


def get_current_user(authorization: str | None = Header(default=None, alias="Authorization")):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Bearer token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_access_token(token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    email = payload.get("sub")
    role_id = payload.get("role_id")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    return {"email": email, "role_id": role_id}
