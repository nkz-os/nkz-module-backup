from fastapi import HTTPException, Security, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx
from ..config import get_settings

security = HTTPBearer()
settings = get_settings()

# Cache for JWKS keys
_jwks_keys = None

async def get_jwks():
    global _jwks_keys
    if _jwks_keys is None:
        async with httpx.AsyncClient() as client:
            # Internal Keycloak (JWKS_URL must be the cluster-internal http URL,
            # e.g. http://keycloak-service:8080/auth/...). No SSL bypass — FIWARE/
            # platform rule forbids verify=False; for http it is a no-op anyway.
            resp = await client.get(settings.JWKS_URL)
            _jwks_keys = resp.json()
    return _jwks_keys

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        # 1. Get header to find key ID
        unverified_header = jwt.get_unverified_header(token)
        
        # 2. Get JWKS and find correct key
        jwks = await get_jwks()
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
                
        if not rsa_key:
            raise HTTPException(status_code=401, detail="Unable to find appropriate key")
            
        # 3. Verify token
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=[settings.JWT_ALGORITHM],
            audience=settings.JWT_AUDIENCE,
            issuer=settings.JWT_ISSUER
        )
        
        # 4. Extract tenant info
        # Keycloak custom mapper should output tenant_id
        # Fallback for dev: check 'fiware-service' header if needed, but token is safer
        tenant_id = payload.get("tenant_id")
        roles = payload.get("realm_access", {}).get("roles", [])
        
        if not tenant_id:
             # Try fallback from resource_access or other claims structure depending on Keycloak config
             # For now, require tenant_id in token (standard NKZ pattern)
             pass 

        return {
            "sub": payload.get("sub"),
            "email": payload.get("email"),
            "tenant_id": tenant_id,
            "roles": roles,
            "username": payload.get("preferred_username")
        }
        
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Could not validate credentials: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")

def require_role(role: str):
    def role_checker(user: dict = Depends(get_current_user)):
        if role not in user["roles"] and "PlatformAdmin" not in user["roles"]:
            raise HTTPException(status_code=403, detail=f"Role {role} required")
        return user
    return role_checker
