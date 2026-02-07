
// TODO: Replace with your Cloudinary Cloud Name and Upload Preset
const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/**
 * Uploads an image to Cloudinary and returns the secure URL.
 * @param {string} uri - The local URI of the image to upload.
 * @returns {Promise<string | null>} - The URL of the uploaded image or null if failed.
 */
export const uploadImageToCloudinary = async (uri: string): Promise<string | null> => {
    if (!uri) return null;

    try {
        const data = new FormData();
        data.append('file', {
            uri: uri,
            type: 'image/jpeg', // Adjust based on file type if needed, or detect
            name: 'upload.jpg',
        } as any);
        data.append('upload_preset', UPLOAD_PRESET);
        data.append('cloud_name', CLOUD_NAME);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: data,
        });

        const result = await response.json();
        if (result.secure_url) {
            return result.secure_url;
        } else {
            console.error("Cloudinary Upload Error:", result);
            return null;
        }
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        return null;
    }
};
