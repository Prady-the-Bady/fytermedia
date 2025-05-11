import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryUploadResult } from '@/types/cloudinary';
import { authOptions } from '@/lib/auth';

// Initialize Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get file data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mediaType = formData.get('mediaType') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type based on mediaType
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const valid3DTypes = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'];
    
    // Set upload parameters based on media type
    let uploadParams: any = {
      resource_type: 'auto',
      folder: `futuremedia/${session.user.id || 'anonymous'}`,
    };
    
    // Add specific transformations based on media type
    if (mediaType === 'image' && validImageTypes.includes(file.type)) {
      uploadParams.eager = [
        { width: 800, height: 800, crop: 'fill' },
        { width: 400, height: 400, crop: 'fill' },
      ];
    } else if (mediaType === 'video' && validVideoTypes.includes(file.type)) {
      uploadParams.eager = [
        { raw_transformation: 'q_auto:good' },
      ];
    } else if (mediaType === '3d' && valid3DTypes.includes(file.type)) {
      uploadParams.resource_type = 'raw';
    } else {
      return NextResponse.json(
        { error: 'Invalid file type for the specified media type' },
        { status: 400 }
      );
    }

    // Convert file to buffer for cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Generate a unique filename
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    
    // Create upload stream
    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        uploadParams,
        (error: any, result: CloudinaryUploadResult) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });
    
    // Return success response with Cloudinary URL
    return NextResponse.json({
      success: true,
      url: (result as any).secure_url,
      publicId: (result as any).public_id,
      mediaType,
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Define maximum file size (10MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
