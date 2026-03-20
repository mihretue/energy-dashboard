from fastapi import FastAPI, UploadFile, File
from backend.services.parser import parse_file

app = FastAPI()

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    data = await file.read()
    
    df = parse_file(data, file.filename)
    
    return {
        "columns": df.columns.tolist(),
        "preview": df.head(5).to_dict(orient="records")
    }