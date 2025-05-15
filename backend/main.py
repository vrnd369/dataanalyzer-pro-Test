from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import regression

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(regression.router, prefix="/api/regression", tags=["regression"]) 