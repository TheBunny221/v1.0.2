import React, { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  Camera,
  Upload,
  X,
  FileImage,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useUploadComplaintPhotosMutation } from "../store/api/complaintsApi";

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaintId: string;
  onSuccess?: () => void;
}

interface PhotoFile {
  file: File;
  preview: string;
  id: string;
}

const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  complaintId,
  onSuccess,
}) => {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [description, setDescription] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [uploadPhotos, { isLoading: isUploading }] = useUploadComplaintPhotosMutation();

  // Validate file type and size
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, and WebP images are allowed';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const validFiles: PhotoFile[] = [];
    const errors: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        const photoFile: PhotoFile = {
          file,
          preview: URL.createObjectURL(file),
          id: Math.random().toString(36).substr(2, 9),
        };
        validFiles.push(photoFile);
      }
    });

    if (errors.length > 0) {
      setUploadError(errors.join(', '));
    } else {
      setUploadError(null);
    }

    setPhotos((prev) => [...prev, ...validFiles]);
  }, []);

  // Start camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Unable to access camera. Please check permissions or use file upload instead.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert canvas to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File([blob], `camera-capture-${timestamp}.jpg`, {
          type: 'image/jpeg',
        });

        const photoFile: PhotoFile = {
          file,
          preview: URL.createObjectURL(file),
          id: Math.random().toString(36).substr(2, 9),
        };

        setPhotos((prev) => [...prev, photoFile]);
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  };

  // Remove photo
  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const updated = prev.filter((photo) => photo.id !== id);
      // Revoke URL to prevent memory leaks
      const removed = prev.find((photo) => photo.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  // Handle upload
  const handleUpload = async () => {
    if (photos.length === 0) {
      setUploadError('Please select at least one photo to upload');
      return;
    }

    try {
      setUploadError(null);
      await uploadPhotos({
        complaintId,
        photos: photos.map(p => p.file),
        description: description.trim() || undefined,
      }).unwrap();

      // Clean up and close
      photos.forEach(photo => URL.revokeObjectURL(photo.preview));
      setPhotos([]);
      setDescription('');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.data?.message || 'Failed to upload photos. Please try again.');
    }
  };

  // Handle modal close
  const handleClose = () => {
    // Clean up previews
    photos.forEach(photo => URL.revokeObjectURL(photo.preview));
    setPhotos([]);
    setDescription('');
    setUploadError(null);
    stopCamera();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Photos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Upload from Files</Label>
              <Button
                variant="outline"
                className="w-full justify-start mt-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>

            <div>
              <Label>Use Camera</Label>
              {!isCameraActive ? (
                <Button
                  variant="outline"
                  className="w-full justify-start mt-1"
                  onClick={startCamera}
                  disabled={isUploading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Open Camera
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start mt-1"
                  onClick={stopCamera}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Close Camera
                </Button>
              )}
            </div>
          </div>

          {/* Camera Interface */}
          {isCameraActive && (
            <div className="space-y-2">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
                style={{ maxHeight: '300px' }}
              />
              <div className="flex justify-center">
                <Button onClick={capturePhoto} disabled={isUploading}>
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Photo
                </Button>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Camera Error */}
          {cameraError && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{cameraError}</span>
            </div>
          )}

          {/* Selected Photos */}
          {photos.length > 0 && (
            <div>
              <Label>Selected Photos ({photos.length})</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.preview}
                      alt="Preview"
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(photo.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <Badge className="absolute bottom-1 left-1 text-xs bg-black/70 text-white">
                      {(photo.file.size / 1024 / 1024).toFixed(1)}MB
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description of what these photos show..."
              rows={3}
              disabled={isUploading}
            />
          </div>

          {/* Upload Error */}
          {uploadError && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{uploadError}</span>
            </div>
          )}

          {/* File Requirements */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <FileImage className="h-4 w-4" />
              <span className="font-medium">Requirements:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Supported formats: JPEG, PNG, WebP</li>
              <li>Maximum file size: 5MB per image</li>
              <li>Maximum 10 photos at once</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={photos.length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {photos.length} Photo{photos.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoUploadModal;
