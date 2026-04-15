import os
import insightface
from insightface.app import FaceAnalysis
import numpy as np

# Initialize FaceAnalysis with the buffalo_l model
# ctx_id=0 for GPU, ctx_id=-1 for CPU. 
# Using -1 (CPU) for default compatibility unless CUDA is specifically configured
_app = FaceAnalysis(name='buffalo_l', root=os.path.join(os.path.expanduser('~'), '.insightface'))
_app.prepare(ctx_id=-1, det_size=(640, 640))

def get_largest_face_embedding(img_path: str) -> bytes | None:
    """
    Reads an image from img_path, detects faces, 
    and returns the 512-dimensional embedding for the largest face found, encoded as bytes.
    """
    import cv2
    img = cv2.imread(img_path)
    if img is None:
        return None
        
    faces = _app.get(img)
    if not faces:
        return None
        
    # Get the bounding box area to find the largest face
    largest_face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
    
    # embedding is a numpy array (dtype=float32) of shape (512,)
    # Converting directly to bytes so it can be stored as bytea in PostgreSQL
    return largest_face.embedding.tobytes()
